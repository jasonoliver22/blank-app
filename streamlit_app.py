import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import streamlit as st

st.set_page_config(page_title="ChatWrapped", page_icon="💬")
st.title("🎁 ChatWrapped")
st.write("Welcome to **ChatWrapped**! 🎉  \\\nThis app unwraps your chatbot history and shows fun stats about how you chat.  \\\nUpload your export file (JSON or ZIP), and let’s dig into your conversation habits!")

uploaded = st.file_uploader("Upload JSON or ZIP", type=["json", "zip"]) 

# ---------------------- Minimal helpers ---------------------- #

def count_chats(obj: Any) -> int:
    if isinstance(obj, list):
        return len(obj)
    if isinstance(obj, dict) and isinstance(obj.get("conversations"), list):
        return len(obj["conversations"])
    return 0

def load_json_or_first_json_in_zip(file_bytes: bytes) -> Dict[str, Any] | List[Any]:
    try:
        return json.loads(file_bytes.decode("utf-8"))
    except Exception:
        pass
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        for name in zf.namelist():
            if name.lower().endswith(".json") and not name.lower().endswith(".schema.json"):
                return json.loads(zf.read(name).decode("utf-8"))
    raise ValueError("No valid JSON found (raw or inside ZIP)")

def _safe_float(x: Any) -> Optional[float]:
    try:
        if isinstance(x, (int, float)):
            return float(x)
        return float(str(x))
    except Exception:
        return None

def _iter_mapping_messages(conv: Dict[str, Any]):
    mapping = conv.get("mapping") if isinstance(conv, dict) else None
    if not isinstance(mapping, dict):
        return
    for node in mapping.values():
        msg = (node or {}).get("message")
        if isinstance(msg, dict):
            yield msg

def _conversation_times(conv: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
    start = _safe_float(conv.get("create_time"))
    end = _safe_float(conv.get("update_time"))
    msg_times: List[float] = []
    for msg in _iter_mapping_messages(conv):
        t = _safe_float(msg.get("create_time")) or _safe_float(msg.get("update_time"))
        if t is not None:
            msg_times.append(t)
    if (start is None or end is None) and msg_times:
        if start is None:
            start = min(msg_times)
        if end is None:
            end = max(msg_times)
    return start, end

def _extract_conversations(obj: Any) -> List[Dict[str, Any]]:
    if isinstance(obj, list):
        return [x for x in obj if isinstance(x, dict)]
    if isinstance(obj, dict) and isinstance(obj.get("conversations"), list):
        return [x for x in obj["conversations"] if isinstance(x, dict)]
    return []

def _fmt_dt(ts: Optional[float]) -> str:
    if ts is None:
        return "—"
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

# ------------------------- Main flow ------------------------- #
parsed = None
if uploaded:
    try:
        parsed = load_json_or_first_json_in_zip(uploaded.read())
        st.session_state["parsed_data"] = parsed
    except json.JSONDecodeError as e:
        st.error(f"Invalid JSON: {e}")
    except zipfile.BadZipFile:
        st.error("File isn't valid JSON or a valid ZIP containing JSON.")
    except Exception as e:
        st.error(f"Couldn't process file: {e}")

if parsed is None:
    parsed = st.session_state.get("parsed_data")

if parsed is not None:
    convs = _extract_conversations(parsed)

    spans = [(_conversation_times(c), c) for c in convs]
    starts = [s for (s, _e), _c in spans if s is not None]
    ends = [e for (_s, e), _c in spans if e is not None]

    earliest_ts = min(starts) if starts else None
    latest_ts = max(ends) if ends else None

    if earliest_ts is not None and latest_ts is not None and latest_ts >= earliest_ts:
        window_days = max(1.0, (latest_ts - earliest_ts) / 86400.0)
        avg_per_day = len(convs) / window_days
    else:
        avg_per_day = None

    longest_break_s = None
    if len(starts) >= 2:
        starts_sorted = sorted(starts)
        gaps = [b - a for a, b in zip(starts_sorted, starts_sorted[1:])]
        if gaps:
            longest_break_s = max(gaps)

    from collections import Counter

    most_active_day_label = "—"
    most_active_day_count = None
    if starts:
        start_dates = [datetime.fromtimestamp(s, tz=timezone.utc).date() for s in starts]
        counter = Counter(start_dates)
        day, cnt = max(counter.items(), key=lambda kv: (kv[1], kv[0]))
        most_active_day_label = day.strftime("%Y-%m-%d") + " UTC"
        most_active_day_count = cnt

    def _count_turns(conv: Dict[str, Any]) -> int:
        if not isinstance(conv, dict):
            return 0
        mapping = conv.get("mapping")
        if not isinstance(mapping, dict):
            return 0
        turns = 0
        for node in mapping.values():
            msg = (node or {}).get("message")
            if isinstance(msg, dict):
                turns += 1
        return turns

    longest_conv_turns = None
    longest_conv_title = None
    if convs:
        pairs = [(_count_turns(c), c) for c in convs]
        if pairs:
            longest_conv_turns, conv_ref = max(pairs, key=lambda kv: kv[0])
            longest_conv_title = str(conv_ref.get("title", "(untitled)"))

    streak_len = None
    streak_range = None
    if starts:
        unique_days = sorted(set(datetime.fromtimestamp(s, tz=timezone.utc).date() for s in starts))
        best = cur = 1
        best_start = cur_start = unique_days[0]
        best_end = cur_end = unique_days[0]
        for a, b in zip(unique_days, unique_days[1:]):
            if (b - a).days == 1:
                cur += 1
                cur_end = b
            else:
                if cur > best:
                    best, best_start, best_end = cur, cur_start, cur_end
                cur = 1
                cur_start = cur_end = b
        if cur > best:
            best, best_start, best_end = cur, cur_start, cur_end
        streak_len = best
        streak_range = (best_start, best_end)

    # Politeness score (1–5 based on % of user messages containing please/thank you)
    polite_count = 0
    total_user_msgs = 0
    for conv in convs:
        for msg in _iter_mapping_messages(conv):
            if msg.get("author", {}).get("role") == "user":
                parts = msg.get("content", {}).get("parts", [])
                if isinstance(parts, list):
                    parts = [p for p in parts if isinstance(p, str)]
                text = " ".join(parts)
                total_user_msgs += 1
                if any(word in text.lower() for word in ["please", "thank you", "thanks"]):
                    polite_count += 1
    politeness_ratio = polite_count / total_user_msgs if total_user_msgs else 0
    politeness_score = int(round(1 + politeness_ratio * 4)) if total_user_msgs else "—"

    st.subheader("Summary")

    r1c1, r1c2, r1c3 = st.columns(3)
    with r1c1:
        total = count_chats(parsed)
        st.metric("Total number of chats", str(total))
    with r1c2:
        st.metric("First chat ever (earliest)", _fmt_dt(earliest_ts))
    with r1c3:
        st.metric("Most recent chat (latest)", _fmt_dt(latest_ts))

    r2c1, r2c2, r2c3 = st.columns(3)
    with r2c1:
        st.metric("Average chats per day", f"{avg_per_day:.2f}" if avg_per_day is not None else "—")
    with r2c2:
        if longest_break_s is not None:
            days = longest_break_s / 86400.0
            st.metric("Longest break between chats", f"{days:.2f} days")
        else:
            st.metric("Longest break between chats", "—")
    with r2c3:
        st.metric("Politeness score (1–5)", str(politeness_score))

    r3c1, r3c2, r3c3 = st.columns(3)
    with r3c1:
        val = f"{most_active_day_count} chats" if most_active_day_count is not None else "—"
        st.metric("Most active day", val)
        st.caption(most_active_day_label)
    with r3c2:
        st.metric("Longest conversation (turns)", str(longest_conv_turns) if longest_conv_turns is not None else "—")
        st.caption(longest_conv_title or "—")
    with r3c3:
        if streak_len is not None and streak_range is not None:
            st.metric("Longest active streak", f"{streak_len} days")
            st.caption(f"{streak_range[0].strftime('%Y-%m-%d')} → {streak_range[1].strftime('%Y-%m-%d')} UTC")
        else:
            st.metric("Longest active streak", "—")
            st.caption("—")

    # Titles preview (not in expander)
    st.subheader("Preview conversation titles (first 50)")
    titles: List[str] = []
    if isinstance(parsed, list):
        titles = [str(x.get("title", "(untitled)")) for x in parsed[:50] if isinstance(x, dict)]
    elif isinstance(parsed, dict) and isinstance(parsed.get("conversations"), list):
        titles = [str(x.get("title", "(untitled)")) for x in parsed["conversations"][:50] if isinstance(x, dict)]
    if titles:
        st.write("\n".join(f"• {t}" for t in titles))
    else:
        st.info("No titles found; counts still computed from structure.")

st.caption("Tip: If a large JSON fails to upload, compress it as ZIP. This app auto-detects JSON inside.")
