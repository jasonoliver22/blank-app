# 🎁 ChatWrapped 2025

Your personal AI conversation analytics dashboard! Upload your chatbot export and discover fascinating insights about your chatting patterns, themes, and personality.

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://blank-app-template.streamlit.app/)

## Features

- **📊 Chat Analytics**: Total conversations, frequency, streaks, and more
- **🎭 AI Persona Analysis**: Discover your chat personality using Claude 4 Sonnet
- **⏰ Usage Patterns**: Peak hours, weekend vs weekday activity, conversation length
- **🎨 Theme Analysis**: What topics you chat about most
- **🔍 Evidence-Based Insights**: Specific examples from your conversations

## How to run it on your own machine

1. Install the requirements

   ```
   $ pip install -r requirements.txt
   ```

2. Set up your Claude API key (for persona analysis)

   ```bash
   export ANTHROPIC_API_KEY="your-claude-api-key-here"
   ```

3. Run the app

   ```
   $ streamlit run streamlit_app.py
   ```

## API Key Setup

The persona analysis feature uses Claude 4 Sonnet to read through your actual conversation content. To use this feature:

1. Get a Claude API key from [Anthropic](https://console.anthropic.com/)
2. Set the `ANTHROPIC_API_KEY` environment variable
3. The app will automatically use Claude to analyze your conversation themes and personality

Without the API key, you'll still get all other analytics, but the persona analysis will be disabled.
