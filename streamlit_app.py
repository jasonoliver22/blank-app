import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
import os

import streamlit as st
from collections import Counter

# Try to import anthropic, handle gracefully if not available
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    anthropic = None

# Try to load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, continue without it


st.set_page_config(page_title="ChatWrapped", page_icon="💬")
st.title("🎁 Your 2025 ChatWrapped")
st.write("Welcome to **Your 2025 ChatWrapped**! 🎉  \\\nThis app unwraps your chatbot history from 2025 and shows fun stats about how you chat.  \\\nUpload your export file (JSON or ZIP), and let's dig into your conversation habits from this year!")

uploaded = st.file_uploader("Upload JSON or ZIP", type=["json", "zip"]) 

# ---------------------- Minimal helpers ---------------------- #

def count_chats(obj: Any) -> int:
    if isinstance(obj, list):
        return len(obj)
    if isinstance(obj, dict) and isinstance(obj.get("conversations"), list):
        return len(obj["conversations"])
    return 0

def load_json_or_first_json_in_zip(file_bytes: bytes) -> Union[Dict[str, Any], List[Any]]:
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

def _filter_by_year(conversations: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
    """Filter conversations to only include those from the specified year."""
    filtered = []
    for conv in conversations:
        start, end = _conversation_times(conv)
        if start is not None:
            conv_year = datetime.fromtimestamp(start, tz=timezone.utc).year
            if conv_year == year:
                filtered.append(conv)
    return filtered

def _analyze_themes(titles: List[str]) -> str:
    """Simple theme analysis using keyword extraction and basic patterns."""
    if not titles:
        return "No conversation titles available for theme analysis."
    
    # Clean and normalize titles
    cleaned_titles = []
    for title in titles:
        if title and title != "(untitled)":
            cleaned_titles.append(title.lower().strip())
    
    if not cleaned_titles:
        return "No meaningful conversation titles found for theme analysis."
    
    # Common theme keywords
    theme_keywords = {
        "coding": ["code", "programming", "python", "javascript", "function", "debug", "bug", "api", "database", "sql", "html", "css", "react", "node", "git", "github"],
        "learning": ["learn", "study", "tutorial", "course", "education", "explain", "understand", "concept", "theory", "practice", "skill"],
        "writing": ["write", "essay", "article", "blog", "content", "story", "poem", "creative", "draft", "edit", "grammar", "style"],
        "work": ["work", "job", "career", "project", "meeting", "presentation", "report", "business", "professional", "office", "team"],
        "personal": ["personal", "life", "relationship", "family", "friend", "health", "fitness", "travel", "hobby", "interest", "goal"],
        "problem_solving": ["problem", "solve", "issue", "fix", "help", "troubleshoot", "error", "solution", "advice", "recommendation"],
        "creative": ["creative", "design", "art", "music", "drawing", "painting", "idea", "inspiration", "brainstorm", "imagine"],
        "technical": ["technical", "system", "server", "cloud", "deployment", "configuration", "setup", "install", "tool", "software"]
    }
    
    # Count theme occurrences
    theme_counts = {theme: 0 for theme in theme_keywords.keys()}
    theme_examples = {theme: [] for theme in theme_keywords.keys()}
    
    for title in cleaned_titles:
        for theme, keywords in theme_keywords.items():
            for keyword in keywords:
                if keyword in title:
                    theme_counts[theme] += 1
                    if len(theme_examples[theme]) < 3:  # Keep up to 3 examples
                        theme_examples[theme].append(title)
                    break
    
    # Find top themes
    sorted_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)
    top_themes = [(theme, count) for theme, count in sorted_themes if count > 0]
    
    if not top_themes:
        return "No clear themes detected in your conversation titles. Your chats cover a wide variety of topics!"
    
    # Generate theme analysis
    analysis_parts = []
    
    if len(top_themes) == 1:
        theme, count = top_themes[0]
        theme_name = theme.replace("_", " ").title()
        analysis_parts.append(f"🎯 **{theme_name}** dominates your 2025 chats! You had {count} conversations related to {theme_name.lower()}.")
    else:
        analysis_parts.append("🎯 **Your top conversation themes in 2025:**")
        for i, (theme, count) in enumerate(top_themes[:3], 1):
            theme_name = theme.replace("_", " ").title()
            analysis_parts.append(f"{i}. **{theme_name}** ({count} conversations)")
    
    # Add examples
    if top_themes:
        top_theme = top_themes[0][0]
        if theme_examples[top_theme]:
            analysis_parts.append(f"\n📝 **Examples of your {top_theme.replace('_', ' ')} conversations:**")
            for example in theme_examples[top_theme][:3]:
                analysis_parts.append(f"• \"{example}\"")
    
    return "\n".join(analysis_parts)

def _extract_conversation_content(conv: Dict[str, Any]) -> Dict[str, Any]:
    """Extract full conversation content including user messages, titles, and agent messages."""
    content = {
        "title": conv.get("title", "(untitled)"),
        "user_messages": [],
        "agent_messages": [],
        "conversation_summary": ""
    }
    
    # Extract messages from mapping
    mapping = conv.get("mapping", {})
    if isinstance(mapping, dict):
        for node in mapping.values():
            if node and isinstance(node, dict):
                message = node.get("message")
                if isinstance(message, dict):
                    author = message.get("author", {})
                    role = author.get("role") if isinstance(author, dict) else None
                    message_content = message.get("content", {})
                    
                    # Extract text content
                    text_content = ""
                    if isinstance(message_content, dict):
                        parts = message_content.get("parts", [])
                        if isinstance(parts, list):
                            text_parts = [p for p in parts if isinstance(p, str)]
                            text_content = " ".join(text_parts)
                    elif isinstance(message_content, str):
                        text_content = message_content
                    
                    if text_content.strip():
                        if role == "user":
                            content["user_messages"].append(text_content)
                        elif role == "assistant":
                            content["agent_messages"].append(text_content)
    
    return content

def _analyze_persona_with_llm(conversations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Use Claude 4 Sonnet to analyze conversation content and determine persona."""
    
    # Check if anthropic is available
    if not ANTHROPIC_AVAILABLE:
        return {"error": "Anthropic module not available. Please install with: pip install anthropic"}
    
    # Initialize Claude client
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    except Exception as e:
        return {"error": f"Failed to initialize Claude client: {str(e)}"}
    
    # Extract conversation content
    conversation_data = []
    for conv in conversations[:20]:  # Limit to first 20 conversations to stay within token limits
        content = _extract_conversation_content(conv)
        if content["user_messages"] or content["agent_messages"]:
            conversation_data.append(content)
    
    if not conversation_data:
        return {"error": "No conversation content found for analysis"}
    
    # Prepare conversation summary for LLM
    conversation_summary = ""
    for i, conv in enumerate(conversation_data, 1):
        conversation_summary += f"\n--- Conversation {i}: {conv['title']} ---\n"
        # Include more user messages for better quote selection
        user_msgs = conv['user_messages'][:5]  # First 5 user messages
        for j, msg in enumerate(user_msgs, 1):
            conversation_summary += f"User message {j}: \"{msg}\"\n"
        if conv['agent_messages']:
            conversation_summary += f"Agent context: {' | '.join(conv['agent_messages'][:2])}\n"  # First 2 agent messages for context
    
    # Define personas
    personas = {
        "Culturista": "The Culturista is always in the know about the latest trends, entertainment, and cultural phenomena. They love discussing movies, music, celebrities, and what's happening in the world of pop culture.",
        "News Junkie": "The News Junkie stays informed about current events, politics, and world affairs. They're always up-to-date on the latest news and love engaging in discussions about what's happening around the globe.",
        "Hopeless Romantic": "The Hopeless Romantic values relationships, family, and matters of the heart. They often seek advice about love, discuss family matters, and enjoy conversations about personal connections and emotional topics.",
        "Academic": "The Academic is intellectually curious and loves learning about science, technology, and scholarly topics. They enjoy deep discussions about research, theories, and expanding their knowledge base.",
        "Geek": "The Geek is passionate about technology, coding, and all things digital. They love solving technical problems, discussing programming languages, and exploring the latest in tech innovation.",
        "Chatter": "The Chatter is a general conversationalist who enjoys chatting about a variety of topics. Their AI conversations span many different areas, showing diverse interests and curious nature."
    }
    
    # Create prompt for Claude
    prompt = f"""Analyze the following AI conversation history and classify the user into one of these personas based on their conversation themes and content:

PERSONAS:
{chr(10).join([f"- {name}: {desc}" for name, desc in personas.items()])}

CONVERSATION HISTORY:
{conversation_summary}

Please provide your analysis in the following JSON format:
{{
    "persona": "PersonaName",
    "confidence": "high|medium|low",
    "reasoning": "Brief explanation of why this persona fits best",
    "theme_summary": "Short summary of the user's main chat themes and interests",
    "evidence": [
        "Exact quote from user message: \"[actual user quote here]\"",
        "Another exact quote: \"[actual user quote here]\"",
        "Third exact quote: \"[actual user quote here]\""
    ]
}}

IMPORTANT: For evidence, provide actual quotes from the user's messages that demonstrate the persona characteristics. Use the exact words the user wrote, enclosed in quotes. Focus on the actual content and themes of conversations, not usage patterns. Look for recurring topics, interests, and conversation styles."""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse the response
        response_text = response.content[0].text
        # Extract JSON from response
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            return {"error": "Could not parse LLM response"}
            
    except Exception as e:
        return {"error": f"LLM analysis failed: {str(e)}"}

def _fmt_dt(ts: Optional[float]) -> str:
    if ts is None:
        return "—"
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

def _fmt_dt_narrative(ts: Optional[float]) -> str:
    if ts is None:
        return "unknown"
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return dt.strftime("%A %B %d, %Y at %I:%M%p")

def _fmt_dt_relative(ts: Optional[float]) -> str:
    if ts is None:
        return "unknown"
    now = datetime.now(timezone.utc)
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    diff = now - dt
    
    if diff.days == 0:
        return "today"
    elif diff.days == 1:
        return "yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    elif diff.days < 30:
        weeks = diff.days // 7
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    elif diff.days < 365:
        months = diff.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    else:
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"


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
    all_convs = _extract_conversations(parsed)
    current_year = datetime.now().year
    convs = _filter_by_year(all_convs, current_year)

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

    # Enhanced longest break calculation with specific days
    longest_break_s = None
    longest_break_start_date = None
    longest_break_end_date = None
    if len(starts) >= 2:
        starts_sorted = sorted(starts)
        gaps = []
        for i in range(len(starts_sorted) - 1):
            gap = starts_sorted[i + 1] - starts_sorted[i]
            gaps.append((gap, starts_sorted[i], starts_sorted[i + 1]))
        
        if gaps:
            longest_gap, start_ts, end_ts = max(gaps, key=lambda x: x[0])
            longest_break_s = longest_gap
            longest_break_start_date = datetime.fromtimestamp(start_ts, tz=timezone.utc).strftime("%A, %B %d, %Y")
            longest_break_end_date = datetime.fromtimestamp(end_ts, tz=timezone.utc).strftime("%A, %B %d, %Y")

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

    st.subheader(f"Your {current_year} ChatWrapped Story")
    
    # Total chats
    total = len(convs)
    st.markdown(f"### 💬 **{total}** conversations")
    st.write(f"In {current_year}, you've had a total of **{total}** conversations with your AI chatbot. That's quite the digital journey!")
    with st.expander("How is this calculated?"):
        st.write("Counts the total number of conversations in your export file. This includes all chat sessions, whether they have titles or are untitled.")
    
    st.divider()
    
    # First and last chat
    if earliest_ts is not None and latest_ts is not None:
        first_date = _fmt_dt_narrative(earliest_ts)
        last_date = _fmt_dt_narrative(latest_ts)
        last_relative = _fmt_dt_relative(latest_ts)
        
        # Find the title of the first chat
        first_chat_title = "(untitled)"
        for conv in convs:
            start, _ = _conversation_times(conv)
            if start is not None and abs(start - earliest_ts) < 1:  # Within 1 second tolerance
                first_chat_title = conv.get("title", "(untitled)")
                break
        
        st.markdown("### 🚀 **Your 2025 chat journey**")
        st.write(f"The first time you chatted in 2025 was on **{first_date}** about **\"{first_chat_title}\"** and your most recent chat was **{last_relative}** on **{last_date}**.")
        with st.expander("How is this calculated?"):
            st.write("Finds the earliest and most recent timestamps from all conversations. This looks at the 'create_time' and 'update_time' fields of each conversation, or if those are missing, uses the earliest and latest message timestamps within each conversation.")
    else:
        st.markdown("### 🚀 **Your 2025 chat journey**")
        st.write("Unable to determine your first and last chat times from the 2025 data.")
        with st.expander("How is this calculated?"):
            st.write("Finds the earliest and most recent timestamps from all conversations. This looks at the 'create_time' and 'update_time' fields of each conversation, or if those are missing, uses the earliest and latest message timestamps within each conversation.")
    
    st.divider()
    
    # Average chats per day
    if avg_per_day is not None:
        st.markdown("### 📊 **{:.1f}** chats per day".format(avg_per_day))
        st.write(f"In 2025, on average, you chat with your AI **{avg_per_day:.1f}** times per day. That's some consistent engagement!")
        with st.expander("How is this calculated?"):
            st.write("Calculates the average number of chats per day by dividing the total number of conversations by the number of days between your first and last chat. The minimum window is 1 day to avoid division by zero.")
    else:
        st.markdown("### 📊 **Average chats per day**")
        st.write("Unable to calculate your average chats per day for 2025.")
        with st.expander("How is this calculated?"):
            st.write("Calculates the average number of chats per day by dividing the total number of conversations by the number of days between your first and last chat. The minimum window is 1 day to avoid division by zero.")
    
    st.divider()
    
    # Longest break - Enhanced with specific days
    if longest_break_s is not None:
        days = longest_break_s / 86400.0
        st.markdown("### ⏰ **{:.1f}** days".format(days))
        st.write(f"In 2025, your longest break between chats was **{days:.1f}** days from **{longest_break_start_date}** to **{longest_break_end_date}**. Everyone needs a digital detox sometimes!")
        with st.expander("How is this calculated?"):
            st.write("Finds the longest gap between consecutive chat start times. This sorts all chat start times and calculates the time difference between each consecutive pair, then returns the largest gap.")
    else:
        st.markdown("### ⏰ **Longest break**")
        st.write("Unable to calculate your longest break between chats in 2025.")
        with st.expander("How is this calculated?"):
            st.write("Finds the longest gap between consecutive chat start times. This sorts all chat start times and calculates the time difference between each consecutive pair, then returns the largest gap.")
    
    st.divider()
    
    # Average conversation length
    if convs:
        total_turns = sum(_count_turns(conv) for conv in convs)
        avg_conversation_length = total_turns / len(convs)
        st.markdown("### 💬 **{:.1f}** turns per conversation".format(avg_conversation_length))
        if avg_conversation_length >= 20:
            st.write(f"In 2025, your average conversation length is **{avg_conversation_length:.1f}** turns. You love having deep, detailed conversations!")
        elif avg_conversation_length >= 10:
            st.write(f"In 2025, your average conversation length is **{avg_conversation_length:.1f}** turns. You enjoy substantial discussions!")
        elif avg_conversation_length >= 5:
            st.write(f"In 2025, your average conversation length is **{avg_conversation_length:.1f}** turns. You prefer focused, concise conversations.")
        else:
            st.write(f"In 2025, your average conversation length is **{avg_conversation_length:.1f}** turns. You keep things brief and to the point!")
        with st.expander("How is this calculated?"):
            st.write("Calculates the average number of message turns per conversation by counting all messages in all conversations and dividing by the total number of conversations.")
    else:
        st.markdown("### 💬 **Average conversation length**")
        st.write("Unable to calculate your average conversation length for 2025.")
        with st.expander("How is this calculated?"):
            st.write("Calculates the average number of message turns per conversation by counting all messages in all conversations and dividing by the total number of conversations.")
    
    st.divider()
    
    # Peak chatting hours
    if starts:
        # Extract hours from timestamps
        hours = [datetime.fromtimestamp(s, tz=timezone.utc).hour for s in starts]
        hour_counts = Counter(hours)
        most_common_hour, peak_count = hour_counts.most_common(1)[0]
        
        # Convert to readable format
        if most_common_hour == 0:
            time_label = "12:00 AM (midnight)"
        elif most_common_hour < 12:
            time_label = f"{most_common_hour}:00 AM"
        elif most_common_hour == 12:
            time_label = "12:00 PM (noon)"
        else:
            time_label = f"{most_common_hour - 12}:00 PM"
        
        # Determine time of day category
        if 5 <= most_common_hour < 12:
            time_category = "morning person"
            emoji = "🌅"
        elif 12 <= most_common_hour < 17:
            time_category = "afternoon enthusiast"
            emoji = "☀️"
        elif 17 <= most_common_hour < 22:
            time_category = "evening conversationalist"
            emoji = "🌆"
        else:
            time_category = "night owl"
            emoji = "🦉"
        
        st.markdown(f"### {emoji} **{time_label}**")
        st.write(f"In 2025, you're most active at **{time_label}** with **{peak_count}** conversations. You're definitely a **{time_category}**!")
        with st.expander("How is this calculated?"):
            st.write("Analyzes the hour of day when each conversation started and finds the most common hour. This helps identify your peak chatting time and whether you're a morning person, afternoon enthusiast, evening conversationalist, or night owl.")
    else:
        st.markdown("### 🕐 **Peak chatting hours**")
        st.write("Unable to determine your peak chatting hours for 2025.")
        with st.expander("How is this calculated?"):
            st.write("Analyzes the hour of day when each conversation started and finds the most common hour. This helps identify your peak chatting time and whether you're a morning person, afternoon enthusiast, evening conversationalist, or night owl.")
    
    st.divider()
    
    # Weekend vs weekday patterns
    if starts:
        weekend_count = 0
        weekday_count = 0
        
        for start_ts in starts:
            dt = datetime.fromtimestamp(start_ts, tz=timezone.utc)
            # Monday = 0, Sunday = 6
            if dt.weekday() >= 5:  # Saturday (5) or Sunday (6)
                weekend_count += 1
            else:
                weekday_count += 1
        
        total_days = weekend_count + weekday_count
        weekend_percentage = (weekend_count / total_days) * 100 if total_days > 0 else 0
        weekday_percentage = (weekday_count / total_days) * 100 if total_days > 0 else 0
        
        if weekend_percentage > weekday_percentage:
            pattern = "weekend warrior"
            emoji = "🏖️"
            description = f"You're a **{pattern}**! You chat more on weekends ({weekend_percentage:.1f}%) than weekdays ({weekday_percentage:.1f}%)."
        elif weekday_percentage > weekend_percentage:
            pattern = "weekday worker"
            emoji = "💼"
            description = f"You're a **{pattern}**! You chat more on weekdays ({weekday_percentage:.1f}%) than weekends ({weekend_percentage:.1f}%)."
        else:
            pattern = "balanced chatter"
            emoji = "⚖️"
            description = f"You're a **{pattern}**! You chat equally on weekdays ({weekday_percentage:.1f}%) and weekends ({weekend_percentage:.1f}%)."
        
        st.markdown(f"### {emoji} **{weekend_count}** weekend • **{weekday_count}** weekday")
        st.write(description)
        with st.expander("How is this calculated?"):
            st.write("Compares the number of conversations that started on weekends (Saturday and Sunday) versus weekdays (Monday through Friday). This helps identify whether you're more active during work days or leisure time.")
    else:
        st.markdown("### 📅 **Weekend vs weekday patterns**")
        st.write("Unable to determine your weekend vs weekday patterns for 2025.")
        with st.expander("How is this calculated?"):
            st.write("Compares the number of conversations that started on weekends (Saturday and Sunday) versus weekdays (Monday through Friday). This helps identify whether you're more active during work days or leisure time.")
    
    st.divider()
    
    # Politeness score
    st.markdown("### 😊 **Politeness score: {}/5**".format(politeness_score))
    if politeness_score == "—":
        st.write("Unable to calculate your politeness score.")
    elif politeness_score == 5:
        st.write("You're incredibly polite! You use polite words in almost all your messages. What a courteous conversationalist!")
    elif politeness_score >= 4:
        st.write("You're quite polite! You frequently use polite words in your messages. Great manners!")
    elif politeness_score >= 3:
        st.write("You're moderately polite. You use polite words in some of your messages.")
    elif politeness_score >= 2:
        st.write("You occasionally use polite words in your messages.")
    else:
        st.write("You rarely use polite words in your messages. Maybe try adding more 'please' and 'thank you'?")
    
    with st.expander("How is this calculated?"):
        st.write("Analyzes all your user messages and calculates what percentage contain polite words like 'please', 'thank you', or 'thanks'. The score is 1-5, where 1 = 0% polite messages and 5 = 100% polite messages.")
    
    st.divider()
    
    # Most active day
    if most_active_day_count is not None:
        st.markdown("### 🔥 **{}{}**".format(most_active_day_count, " chat" if most_active_day_count == 1 else " chats"))
        st.write(f"In 2025, your most active day was **{most_active_day_label}** when you had **{most_active_day_count}** conversations. That's some serious chatting!")
        with st.expander("How is this calculated?"):
            st.write("Groups all chat start times by date and counts how many chats occurred on each day. Returns the date with the highest number of chats and shows how many chats happened on that day.")
    else:
        st.markdown("### 🔥 **Most active day**")
        st.write("Unable to determine your most active day in 2025.")
        with st.expander("How is this calculated?"):
            st.write("Groups all chat start times by date and counts how many chats occurred on each day. Returns the date with the highest number of chats and shows how many chats happened on that day.")
    
    st.divider()
    
    # Longest conversation
    if longest_conv_turns is not None:
        turn_word = "turn" if longest_conv_turns == 1 else "turns"
        st.markdown(f"### 💭 **{longest_conv_turns}** {turn_word}")
        st.write(f"In 2025, your longest conversation had **{longest_conv_turns}** turns and was titled: **\"{longest_conv_title}\"**. That's quite the deep dive!")
        with st.expander("How is this calculated?"):
            st.write("Counts the number of message turns in each conversation by examining the 'mapping' field. A turn is counted for each message in the conversation, regardless of who sent it. Returns the conversation with the most turns and shows its title.")
    else:
        st.markdown("### 💭 **Longest conversation**")
        st.write("Unable to determine your longest conversation in 2025.")
        with st.expander("How is this calculated?"):
            st.write("Counts the number of message turns in each conversation by examining the 'mapping' field. A turn is counted for each message in the conversation, regardless of who sent it. Returns the conversation with the most turns and shows its title.")
    
    st.divider()
    
    # Longest streak
    if streak_len is not None and streak_range is not None:
        day_word = "day" if streak_len == 1 else "days"
        st.markdown(f"### 🔥 **{streak_len}** {day_word} streak")
        st.write(f"In 2025, your longest active streak was **{streak_len}** days from **{streak_range[0].strftime('%B %d, %Y')}** to **{streak_range[1].strftime('%B %d, %Y')}**. Impressive consistency!")
        with st.expander("How is this calculated?"):
            st.write("Finds the longest consecutive sequence of days where you had at least one chat. This groups chat start times by date, then looks for the longest run of consecutive days with at least one chat. Shows the start and end dates of your longest streak.")
    else:
        st.markdown("### 🔥 **Longest active streak**")
        st.write("Unable to determine your longest active streak in 2025.")
        with st.expander("How is this calculated?"):
            st.write("Finds the longest consecutive sequence of days where you had at least one chat. This groups chat start times by date, then looks for the longest run of consecutive days with at least one chat. Shows the start and end dates of your longest streak.")

    # Persona analysis
    st.subheader("🎭 Your 2025 Chat Persona")
    
    if convs:
        # Check if anthropic is available and API key is set
        if not ANTHROPIC_AVAILABLE:
            st.warning("⚠️ **Missing Dependency**: The `anthropic` module is not installed. Please run `pip install anthropic` to enable persona analysis.")
            st.info("The persona analysis uses Claude 4 Sonnet to read through your actual conversation content and determine your personality based on what you discuss, not just titles or keywords.")
        elif not os.getenv("ANTHROPIC_API_KEY"):
            st.warning("⚠️ **API Key Required**: To analyze your chat persona, please set the `ANTHROPIC_API_KEY` environment variable with your Claude API key.")
            st.info("The persona analysis uses Claude 4 Sonnet to read through your actual conversation content and determine your personality based on what you discuss, not just titles or keywords.")
        else:
            # Show loading spinner while analyzing
            with st.spinner("🤖 Analyzing your conversations with Claude 4 Sonnet..."):
                analysis_result = _analyze_persona_with_llm(convs)
            
            if "error" in analysis_result:
                st.error(f"❌ **Analysis failed**: {analysis_result['error']}")
                st.info("Please check your API key and try again.")
            else:
                # Display persona results
                persona = analysis_result.get("persona", "Chatter")
                confidence = analysis_result.get("confidence", "medium")
                reasoning = analysis_result.get("reasoning", "Based on conversation analysis")
                theme_summary = analysis_result.get("theme_summary", "Various topics")
                evidence = analysis_result.get("evidence", [])
                
                # Confidence emoji mapping
                confidence_emoji = {
                    "high": "🎯",
                    "medium": "🎭", 
                    "low": "🤔"
                }
                
                confidence_text = {
                    "high": "perfectly",
                    "medium": "strongly",
                    "low": "somewhat"
                }
                
                st.markdown(f"### {confidence_emoji.get(confidence, '🎭')} You are **{confidence_text.get(confidence, 'strongly')}** a **{persona}**!")
                
                # Persona descriptions
                persona_descriptions = {
                    "Culturista": "The Culturista is always in the know about the latest trends, entertainment, and cultural phenomena. They love discussing movies, music, celebrities, and what's happening in the world of pop culture.",
                    "News Junkie": "The News Junkie stays informed about current events, politics, and world affairs. They're always up-to-date on the latest news and love engaging in discussions about what's happening around the globe.",
                    "Hopeless Romantic": "The Hopeless Romantic values relationships, family, and matters of the heart. They often seek advice about love, discuss family matters, and enjoy conversations about personal connections and emotional topics.",
                    "Academic": "The Academic is intellectually curious and loves learning about science, technology, and scholarly topics. They enjoy deep discussions about research, theories, and expanding their knowledge base.",
                    "Geek": "The Geek is passionate about technology, coding, and all things digital. They love solving technical problems, discussing programming languages, and exploring the latest in tech innovation.",
                    "Chatter": "The Chatter is a general conversationalist who enjoys chatting about a variety of topics. Their AI conversations span many different areas, showing diverse interests and curious nature."
                }
                
                st.write(persona_descriptions.get(persona, "A unique conversationalist with diverse interests."))
                
                # Show reasoning
                st.markdown("#### 🧠 **Why This Persona Fits**")
                st.write(reasoning)
                
                # Show theme summary
                st.markdown("#### 🎨 **Your Chat Themes**")
                st.write(theme_summary)
                
                # Show evidence
                if evidence:
                    st.markdown("#### 🔍 **Evidence from Your Conversations**")
                    st.write("Here are actual quotes from your chats that support this persona:")
                    for i, piece in enumerate(evidence, 1):
                        # Format quotes nicely
                        if piece.startswith('Exact quote') or piece.startswith('Another exact quote') or piece.startswith('Third exact quote'):
                            st.write(f"**{i}.** {piece}")
                        else:
                            st.write(f"**{i}.** \"{piece}\"")
                
                with st.expander("How is my persona determined?"):
                    st.write("Your persona is determined by Claude 4 Sonnet, which reads through your actual conversation content including:")
                    st.write("• **User messages**: What you actually say in conversations")
                    st.write("• **Conversation titles**: The topics you choose to discuss")
                    st.write("• **Agent responses**: The context of your questions and requests")
                    st.write("• **Conversation themes**: Recurring topics and interests across all chats")
                    st.write("\n**Available Personas:**")
                    st.write("• **Culturista**: Pop culture, entertainment, trends")
                    st.write("• **News Junkie**: Current events, politics, world affairs") 
                    st.write("• **Hopeless Romantic**: Relationships, family, love topics")
                    st.write("• **Academic**: Science, research, scholarly topics")
                    st.write("• **Geek**: Technology, coding, programming")
                    st.write("• **Chatter**: General conversationalist with diverse interests")
    else:
        st.info("No 2025 conversations found for persona analysis.")
        with st.expander("How is my persona determined?"):
            st.write("Your persona is determined by Claude 4 Sonnet, which reads through your actual conversation content to understand your interests and personality based on what you discuss.")
    
    st.divider()

    # Titles preview (not in expander)
    st.subheader("Preview 2025 conversation titles (first 50)")
    if convs:
        all_titles = [conv.get("title", "(untitled)") for conv in convs if isinstance(conv, dict)]
        preview_titles = all_titles[:50]
        if preview_titles:
            st.write("\n".join(f"• {t}" for t in preview_titles))
        else:
            st.info("No 2025 conversation titles found; counts still computed from structure.")
    else:
        st.info("No 2025 conversations found.")

st.caption("Tip: If a large JSON fails to upload, compress it as ZIP. This app auto-detects JSON inside.")
