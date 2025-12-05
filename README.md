# Campaign 270: The AI Election / 270号公路：AI大选

A "House of Cards" style political strategy simulation. Manage funds, spin narratives, and use "dark money" to win the US Presidency. Powered by Generative AI (Google Gemini, OpenAI, DeepSeek, Claude, or Local Ollama).

一款“纸牌屋”风格的政治策略模拟游戏。管理资金、引导舆论、使用“黑金”赢得美国总统大选。支持多种 AI 模型（Google Gemini, OpenAI, DeepSeek, Claude, 本地 Ollama）。

## New Features / 新特性

- **Multi-Model Support / 多模型支持**: 
  - Configure your own API keys via the Settings UI.
  - Supports **Google Gemini**, **OpenAI (GPT)**, **DeepSeek**, **Anthropic (Claude)**, **xAI (Grok)**, and local **Ollama**.
  - 配置您自己的 API Key。支持多种主流模型及本地运行的模型。

- **"House of Cards" Mechanics / 纸牌屋机制**:
  - **Tactics / 战术**: Spend campaign funds on "Spin Doctors" or "Smear Campaigns" to manipulate results.
  - **Scandal Meter / 丑闻指数**: Playing dirty increases scandal. High scandal caps your maximum polling numbers.
  - **Cynical AI**: The AI acts as a ruthless political strategist.

- **Dynamic Evaluation**: Your choices are judged based on state culture, strategy, and current scandal levels.

## How to Play / 玩法说明

1.  **Configure AI**: Click "Configure AI" on the start screen. Choose your provider (e.g., Gemini or DeepSeek) and enter your Key.
    **配置 AI**：点击开始屏幕上的“配置 AI”。选择服务商并输入 Key。
2.  **Travel**: Click a state to visit. Costs Funds ($) and Energy.
    **旅行**：点击州进行访问。消耗资金 ($) 和精力。
3.  **Crisis & Tactics**: A scenario will appear. You can optionally spend money on a **Tactic** (e.g., Bribe) before choosing your response.
    **危机与战术**：场景出现后，您可以在做出选择前花费资金使用**战术**（如贿赂）。
4.  **Manage Scandal**: Don't let your Scandal level get too high, or voters will stop listening to you.
    **管理丑闻**：别让丑闻指数太高，否则选民将不再信任你。
5.  **Victory**: Reach **270 Electoral Votes**.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI Integration**: Custom Multi-Provider Service (Native Google SDK + Fetch Adapters for others)

## Setup / 设置

1.  Clone repo & `npm install`.
2.  `npm start`.
3.  In the game, open Settings (⚙️) to enter your API Key. Default supports `process.env.API_KEY` for Gemini.
