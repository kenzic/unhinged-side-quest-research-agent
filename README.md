# Unhinged Research Intern - AI Research Agent

An advanced Next.js demonstration of the Vercel AI SDK featuring a multi-agent orchestration system with Tavily Search integration. This project showcases an "unhinged research intern" that conducts thorough research while getting playfully distracted by interesting tangents.

## 🎯 Overview

This demo implements a sophisticated AI agent architecture that mimics a research intern who balances comprehensive research with genuine curiosity. The agent performs multi-step research workflows, discovers fascinating tangents, verifies facts, and generates well-structured, source-backed responses.

### Key Features

- **Multi-Agent Architecture**: Orchestrates multiple specialized agents (chat, fact-checker, summarizer, tangent-finder)
- **Advanced Web Research**: Deep integration with Tavily Search API for comprehensive web crawling
- **Real-time Streaming**: Live UI updates with tool call visibility and progress indicators
- **Source Attribution**: Automatic citation extraction and display from research results
- **Fact Verification**: Built-in verification layer ensuring accuracy before final output
- **Tangent Discovery**: Systematic exploration of related topics for enriched research
- **Modern UI Components**: Production-ready AI Elements library with Radix UI primitives

## 🏗️ Architecture

### Agent System

The project implements a hierarchical multi-agent system:

```
┌─────────────────────────────────────────────┐
│         Chat Agent (Orchestrator)           │
│  - Coordinates research workflow            │
│  - Manages tool calls and reasoning         │
│  - Implements 8-step research process       │
└──────────────┬──────────────────────────────┘
               │
               ├──► Tavily Search (External API)
               │    - Advanced web crawling
               │    - Multi-source aggregation
               │
               ├──► Fact-Checker Agent
               │    - Claim verification
               │    - Source cross-referencing
               │    - Confidence categorization
               │
               ├──► Summarizer Agent
               │    - Verified fact synthesis
               │    - Structured output generation
               │
               └──► Tangent Finder Agent
                    - Related topic discovery
                    - Curiosity-driven exploration
```

### Research Workflow

The chat agent follows an 8-step research methodology:

1. **Initial Research**: 2-3 Tavily searches on the main question
2. **Natural Distraction**: Notice tangentially related topics (~30-40% probability)
3. **Tangent Exploration**: ONE additional search about the discovered tangent
4. **Self-Awareness**: Acknowledge distraction and return to main topic
5. **Deep Dive**: 2-3 additional searches based on new findings
6. **Tangent Discovery**: Use `findRandomTangents` tool for systematic exploration
7. **Fact Verification**: Use `factCheck` tool to validate all findings
8. **Final Synthesis**: Use `summarize` tool to create verified answer

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm, npm, or yarn package manager
- Tavily API key ([Get one here](https://tavily.com))
- OpenAI API key ([Get one here](https://platform.openai.com))

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd research
```

2. Install dependencies:

```bash
pnpm install
# or
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

4. Run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

### Core Framework

- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **React 18** - UI library with concurrent features

### AI & ML

- **Vercel AI SDK 6** - Advanced AI agent orchestration
- **@ai-sdk/react** - React hooks for AI interactions
- **@ai-sdk/openai** - OpenAI provider for the AI SDK
- **Tavily AI SDK** - Advanced web search integration
- **OpenAI gpt-5** - Underlying language model (configurable)

### UI Components

- **Radix UI** - Accessible component primitives
  - Accordion, Avatar, Dialog, Dropdown Menu, Popover, Progress, Scroll Area, Select, Separator, Switch, Tabs, Tooltip
- **Tailwind CSS 3** - Utility-first styling
- **Lucide React** - Modern icon library
- **Motion** - Animation library

### Specialized Libraries

- **Streamdown** - Streaming markdown processor
- **Shiki** - Syntax highlighting
- **XYFlow React** - Flow diagram visualization
- **Zod 4** - Schema validation
- **Tokenlens** - Token counting utilities

## 📁 Project Structure

```
research/
├── .agents/              # Agent skill definitions and documentation
│   └── skills/          # Reusable agent skills
├── app/                 # Next.js App Router
│   ├── agents/          # Agent implementations
│   │   ├── chat/       # Main orchestrator agent
│   │   ├── fact-checker/   # Verification agent
│   │   ├── summarizer/     # Summary generation agent
│   │   └── random-tangents/ # Tangent discovery agent
│   ├── api/
│   │   └── chat/       # API route handlers
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main chat interface
├── components/          # React components
│   ├── ai-elements/    # Specialized AI UI components
│   │   ├── agent.tsx
│   │   ├── conversation.tsx
│   │   ├── message.tsx
│   │   ├── tool.tsx
│   │   ├── sources.tsx
│   │   └── ... (40+ components)
│   ├── ui/             # Base UI components (Radix + Tailwind)
│   └── prompt-input.tsx # Chat input component
├── lib/
│   └── utils.ts        # Utility functions
├── .env.local          # Environment variables (create this)
├── components.json     # Component configuration
├── next.config.ts      # Next.js configuration
├── package.json        # Dependencies
├── tailwind.config.ts  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## 🔧 Configuration

### Agent Configuration

Modify agent behavior in `app/agents/chat/agent.ts`:

```typescript
import { openai } from "@ai-sdk/openai";

export const createChatAgent = () =>
  new ToolLoopAgent({
    model: openai("gpt-5-mini"), // Change model (e.g. openai("gpt-5-mini"))
    instructions: systemPrompt, // Customize agent personality
    stopWhen: stepCountIs(15), // Adjust max reasoning steps
    tools: {
      tavilySearch: tavilySearch({
        searchDepth: "advanced", // "basic" | "advanced"
        maxResults: 5, // Results per search
      }),
      // ... other tools
    },
  });
```

### Tavily Search Options

Configure search behavior:

- `searchDepth`: "basic" (faster) or "advanced" (deeper crawling)
- `maxResults`: Number of results per search (1-10)
- Additional options available in [Tavily SDK docs](https://docs.tavily.com)

### Model Provider

The project uses the OpenAI provider with gpt-5 by default. To use different models or providers:

```typescript
import { openai } from "@ai-sdk/openai";

// OpenAI (default)
model: openai("gpt-5-mini"); // Lighter/faster

// Other providers require their SDK (e.g. @ai-sdk/anthropic, @ai-sdk/google)
// Claude (Anthropic): import { anthropic } from "@ai-sdk/anthropic"; model: anthropic("claude-3-opus-20240229");
// Gemini (Google): import { google } from "@ai-sdk/google"; model: google("gemini-pro");
```

## 📚 Component Library

### AI Elements

Custom components designed for AI interactions:

- **Conversation**: Chat container with scroll management
- **Message**: Individual message display with role-based styling
- **Tool**: Expandable tool call visualization
- **Sources**: Collapsible source citation display
- **Task**: Progress indicator for multi-step operations
- **Reasoning**: Chain-of-thought display
- **Artifact**: Code/content artifact preview

### Base UI Components

Radix-powered accessible components:

- Buttons, Inputs, TextAreas
- Dialogs, Popovers, Tooltips
- Accordions, Collapsibles, Tabs
- Progress bars, Spinners, Badges
- Select dropdowns, Command palettes

## 🎨 Customization

### Styling

Modify Tailwind configuration in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Add custom color palette
      },
      // Add custom utilities
    },
  },
};
```

### System Prompt

Customize agent personality by editing the `systemPrompt` in `app/agents/chat/agent.ts`. You can adjust:

- Research workflow steps
- Tangent probability
- Output format
- Tone and style
- Content guidelines

### UI Layout

Modify the main interface in `app/page.tsx`:

- Adjust header styling
- Customize input component
- Modify conversation layout
- Add sidebar panels
- Integrate additional features

## 🔍 API Reference

### Chat API Endpoint

**POST** `/api/chat`

Handles streaming chat interactions with the agent system.

**Request Body:**

```typescript
{
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**Response:**
Stream of Server-Sent Events (SSE) containing:

- Text chunks
- Tool calls
- Reasoning steps
- Final response

## 🧪 Development

### Build for Production

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## 📊 Monitoring & Debugging

### Agent Step Logging

Enable detailed logging in `app/agents/chat/agent.ts`:

```typescript
onStepFinish: async (options) => {
  console.log("Step completed:", {
    stepCount: options.stepCount,
    toolCalls: options.toolCalls,
    usage: options.usage,
    text: options.text,
  });
},
```

### Tool Call Tracking

The UI automatically displays tool calls in real-time. Each tool call shows:

- Input parameters
- Execution state
- Output results
- Error messages (if any)

## 🚧 Troubleshooting

### Common Issues

**API Key Errors**

- Ensure `.env.local` exists with valid keys
- Restart dev server after adding environment variables

**Rate Limiting**

- Tavily has rate limits; reduce `maxResults` or add delays
- OpenAI rate limits vary by tier; check your account limits

**Build Errors**

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

**TypeScript Errors**

- Ensure all dependencies are installed
- Check `tsconfig.json` for proper configuration

## 🤝 Contributing

This is a demo project showcasing Vercel AI SDK capabilities. Feel free to:

- Fork and experiment
- Report issues
- Suggest improvements
- Share your implementations

## 📝 License

This project is provided as-is for demonstration and educational purposes.

## 🙏 Acknowledgments

- **Vercel AI SDK** - Advanced agent orchestration framework
- **Tavily** - Powerful web search API
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework

## 🔗 Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Tavily API Documentation](https://docs.tavily.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ using Vercel AI SDK
