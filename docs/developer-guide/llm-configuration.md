# LLM configuration

Purpose: document choices and environment variables for LLM providers.

Providers supported

- OpenAI (OpenAI API key)
- Anthropic (Claude API key)
- Google (Gemini/PaLM key)

Environment variables

- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic API key
- `GOOGLE_API_KEY` — Google LLM API key

Recommendations

- Configure provider fallbacks in `app/core/llm_client.py` and set rate limits.
