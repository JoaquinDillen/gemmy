# Gemmy — AI Writing Companion for Obsidian

<img src="https://user-images.githubusercontent.com/1171143/229297707-5efa8761-ef55-4d01-a105-88a347bc6cf0.png" width="300">

Gemmy started as Obsidian's April Fools' joke — a little animated companion who sits in the corner and says unhelpful things. This fork gives him a brain.

---

## Features

### Click to chat
Click Gemmy to open a floating prompt panel anchored right above him. Type anything and choose how he responds:

- **💬 Reply** — Gemmy answers in a speech bubble above his head (auto-dismisses after 8 s, click to dismiss early)
- **✍️ Insert** — The response is inserted at your cursor position in the active note
- **➕ Append** — The response is appended to the end of the currently open note

Press **Enter** to use the default output mode (configurable). Press **Escape** to close without sending.

### Periodic messages
Gemmy speaks up on his own every now and then — jokes, writing tips, motivational nudges, random facts, or time-aware comments. Toggle this on and configure the frequency and message types in settings.

### Writing mode
Enter writing mode via the command palette. Gemmy disappears while you type and pops back up when you've been idle for too long, ready to motivate (or mock) you.

### Idle nudges
Optionally trigger Gemmy after N minutes of inactivity — a gentle AI-generated nudge to get back to work.

---

## AI / LLM Setup

Gemmy supports multiple providers. All API calls go directly from Obsidian to the provider — no server, no proxy, your key stays local.

| Provider | Free tier | Works from EU |
|---|---|---|
| **OpenRouter** (default) | ✅ Free models available | ✅ |
| **Groq** | ✅ 14 400 req/day free | ✅ |
| **Gemini (Google)** | ⚠️ Requires billing account in EU | ❌ free tier |
| **OpenAI** | ❌ | ✅ paid |
| **Anthropic** | ❌ | ✅ paid |

### Recommended setup (free, works everywhere)
1. Sign up at [openrouter.ai](https://openrouter.ai) — free, no card needed
2. Create an API key in the dashboard
3. In Gemmy settings: set **Provider** to `OpenRouter`, paste your key
4. For the model, paste any model ID from [openrouter.ai/models](https://openrouter.ai/models) — models ending in `:free` cost nothing
   - Stable free options: `meta-llama/llama-3.1-8b-instruct:free`, `mistralai/mistral-7b-instruct:free`

### Alternative: Groq (also free)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. In Gemmy settings: set **Provider** to `Groq`
4. Pick a model from the dropdown (Llama 3.3 70B is the default)

---

## Settings

### AI / LLM
- **Provider** — OpenRouter, Groq, Gemini, OpenAI, or Anthropic
- **API key** — your key for the selected provider
- **Model** — dropdown (fixed providers) or free text (OpenRouter)
- **Max tokens** — hard cap on response length
- **Default output mode** — what Enter does in the chat panel

### Appearance
- **Bubble background colour** — colour picker, applies to both speech bubbles and the chat panel
- **Bubble text colour** — colour picker
- **Bubble font size** — slider (10–20 px)
- **Max response length (words)** — Gemmy tries to stay within this word count (0 = no limit)

### Personality
- **Companion name** — displayed in the chat panel header and used in the system prompt
- **Personality preset** — Wise Mentor, Dry Bot, Eager Assistant, Chaotic Gremlin, Academic, or Custom

### Companion Behaviour
- **Enable random messages** — Gemmy speaks up unprompted using AI
- **Message frequency** — average minutes between messages
- **Message types** — jokes, writing tips, random facts, motivational nudges, vault observations, time-aware comments
- **Silence hours** — Gemmy stays quiet between two configurable times
- **Idle trigger** — Gemmy comments after N minutes of inactivity

### Voice & Tone
- **Response length** — Terse / Balanced / Verbose (used when max words = 0)
- **Language / locale** — respond in a specific language (e.g. `pt-PT`)
- **Enable emoji** — toggle emoji in responses
- **Swearing filter** — keep responses family-friendly

---

## Commands

| Command | Description |
|---|---|
| Show Gemmy | Make Gemmy appear |
| Hide Gemmy | Make Gemmy disappear |
| Enter writing mode | Start writing mode |
| Leave writing mode | Stop writing mode |

---

## Installation (manual)

1. Download `main.js`, `styles.css`, and `manifest.json` from the latest release
2. Copy them into `<your vault>/.obsidian/plugins/gemmy/`
3. Enable the plugin in Obsidian → Settings → Community plugins

---

Special thanks: [Rigmarole](https://rigmarolestudio.com/) for creating and animating Gemmy.

Credit: the talented Obsidian mods team — argentum, CawlinTeffid, cotmax, Eleanor Konik, koala, Leah, rigmarole, ryanjamurphy & WhiteNoise.

The code is under the MIT license. The Gemmy character is under CC BY 3.0.
