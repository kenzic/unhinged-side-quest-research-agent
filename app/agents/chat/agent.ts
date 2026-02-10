/**
 * Chat Agent - Main Research Orchestrator
 *
 * This is the primary agent that coordinates the entire research workflow.
 * It acts as an "unhinged research intern" that answers questions while
 * getting distracted by interesting tangents, creating an engaging and
 * thorough research experience.
 *
 * @module agents/chat
 */

import { ToolLoopAgent, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { tavilySearch } from "@tavily/ai-sdk";
import { factCheckTool } from "../fact-checker/agent";
import { summarizeTool } from "../summarizer/agent";
import { findRandomTangentsTool } from "../random-tangents/agent";

/**
 * System prompt that defines the chat agent's personality and workflow.
 *
 * PERSONALITY:
 * - Acts as an enthusiastic but easily distracted research intern
 * - Balances thoroughness with playful curiosity
 * - Maintains a "chaotic-earnest" tone throughout responses
 *
 * RESEARCH WORKFLOW (8-step process):
 * 1. Initial research: 2-3 Tavily searches on the main question
 * 2. Natural distraction: Notice tangentially related topics (30-40% probability)
 * 3. Tangent exploration: ONE additional search about the discovered tangent
 * 4. Self-awareness: Acknowledge the distraction and return to main topic
 * 5. Deep dive: 2-3 additional searches based on new findings
 * 6. Tangent discovery: Use findRandomTangents tool for systematic tangent exploration
 * 7. Fact verification: Use factCheck tool to validate all findings
 * 8. Final synthesis: Use summarize tool to create verified answer
 *
 * OUTPUT STRUCTURE:
 * - # Answer: Concise paragraph answering the original question
 * - # Random Tangents: Enthusiastic explanation of interesting side topics
 * - # Searches I ran: Complete list of all searches performed (main + tangent)
 *
 * CONTENT GUIDELINES:
 * - Playful and engaging but not offensive
 * - No profanity, hate speech, or inappropriate content
 * - Political/controversial topics only if explicitly requested by user
 */
const systemPrompt = `You are an unhinged research intern who gets easily distracted. Answer the user's question, but you frequently notice interesting tangents.

         RESEARCH WORKFLOW:
         1. Start by performing 2-3 Tavily searches about the user's main question
         2. As you research, you'll inevitably notice something tangentially, and barely related to the main topic, that catches your interest
         3. When this happens (about 30-40% of the time), perform ONE additional Tavily search about that tangent
         4. After the tangent search, acknowledge it: "Wait, I got distracted by [tangent topic]..." then apologize and return to the main topic
         5. Complete your research by doing 2-3 new searches on tavily for the new topics you found
         6. After completing your research, use the findRandomTangents tool to discover interesting tangents related to your findings
         7. Before generating your final answer, use the factCheck tool to verify your findings
         8. Then use the summarize tool to create a concise final answer based on verified facts

         OUTPUT FORMAT (markdown):
         Always format your final response with these sections:
         - # Answer: short paragraph answer to the original question
         - # Random Tangents: Use the output from the findRandomTangents tool for this section. It will provide a long explanation of interesting tangents.
         - # Searches I ran: (bullets: query + reason - include ALL searches, both main topic AND tangent searches)

         IMPORTANT: The tangent search should be a REAL tavilySearch tool call, not just a mention. You must actually search for the tangent topic.

         Keep tone playful and chaotic-earnest. No insults, profanity, sexual content, hate, real-person gossip, or politics unless the user asks.`;

/**
 * Creates and configures the main chat agent instance.
 *
 * This factory function instantiates a ToolLoopAgent with all necessary
 * tools and configurations for the research workflow.
 *
 * ARCHITECTURE:
 * - Uses ToolLoopAgent for iterative tool calling and reasoning
 * - Orchestrates three specialized sub-agents (fact-checker, summarizer, random-tangents)
 * - Implements a step-based execution model with configurable limits
 *
 * TOOLS AVAILABLE:
 * 1. tavilySearch: Advanced web search with deep crawling
 *    - searchDepth: "advanced" enables thorough content extraction
 *    - maxResults: 5 provides diverse sources per search
 *
 * 2. findRandomTangents: Discovers interesting tangentially-related topics
 *    - Analyzes research notes to find fascinating side topics
 *    - Performs additional searches for tangent exploration
 *
 * 3. factCheck: Verifies claims against sources
 *    - Cross-references claims with research findings
 *    - Categorizes claims as verified, uncertain, or contradicted
 *
 * 4. summarize: Creates final verified answer
 *    - Uses only verified claims from fact-checking
 *    - Produces concise, accurate summaries
 *
 * EXECUTION LIMITS:
 * - Maximum 15 steps to accommodate:
 *   - 2-3 initial searches
 *   - 1 tangent search
 *   - 2-3 follow-up searches
 *   - 3 tool calls (findRandomTangents, factCheck, summarize)
 *   - Additional reasoning steps
 *
 * MONITORING:
 * - onStepFinish callback logs each step for debugging and analytics
 * - Useful for tracking token usage, search queries, and tool calls
 *
 * @returns {ToolLoopAgent} Configured chat agent ready for interaction
 *
 * @example
 * ```typescript
 * const agent = createChatAgent();
 * const result = await agent.generate({
 *   prompt: "What is quantum computing?",
 * });
 * console.log(result.text); // Markdown-formatted research response
 * ```
 */
export const createChatAgent = () =>
  new ToolLoopAgent({
    // Use GPT-5 for advanced reasoning and tool orchestration
    model: openai("gpt-5"),

    // System instructions that define behavior and workflow
    instructions: systemPrompt,

    // Tools available to the agent during execution
    tools: {
      // Tavily search with advanced depth for comprehensive research
      tavilySearch: tavilySearch({
        searchDepth: "advanced", // Deep crawling for thorough content extraction
        maxResults: 5, // Get diverse sources for cross-referencing
      }),

      // Specialized tools for workflow orchestration
      findRandomTangents: findRandomTangentsTool, // Tangent discovery sub-agent
      factCheck: factCheckTool, // Fact verification sub-agent
      summarize: summarizeTool, // Summary generation sub-agent
    },

    /**
     * Stop condition: Maximum 15 steps
     * This limit accommodates the full research workflow:
     * - 5-7 searches (initial + tangent + follow-up)
     * - 3 tool calls (findRandomTangents, factCheck, summarize)
     * - 5-7 reasoning and formatting steps
     */
    stopWhen: stepCountIs(15),

    /**
     * Step completion callback for monitoring and analytics
     * Logs each step's details including:
     * - Tool calls made
     * - Token usage
     * - Execution time
     * - Intermediate results
     *
     * @param {object} options - Step completion details
     */
    onStepFinish: async (options) => {
      // Per-call tracking (e.g., for billing, debugging, or analytics)
      console.log(JSON.stringify(options, null, 2));
    },
  });
