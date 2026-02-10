/**
 * Random Tangents Agent - Tangential Discovery Specialist
 *
 * This agent discovers and explores fascinating side topics that are
 * tangentially related to the main research question. It adds an element
 * of curiosity and discovery to the research process, mimicking how
 * real research often leads to interesting unexpected findings.
 *
 * PURPOSE:
 * - Identify interesting connections between topics
 * - Discover fascinating side facts that enrich the research experience
 * - Add an engaging, exploratory element to research responses
 * - Provide additional context through related topics
 *
 * PERSONALITY:
 * Acts like an enthusiastic 8-year-old who just discovered something cool.
 * This creates engaging, fun-to-read content that maintains user interest
 * while providing genuinely interesting information.
 *
 * WORKFLOW POSITION:
 * Called by the main chat agent after initial research but before
 * fact-checking. This allows tangent discoveries to inform the overall
 * research narrative.
 *
 * @module agents/random-tangents
 */

import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { tavilySearch } from "@tavily/ai-sdk";
import { z } from "zod";

/**
 * Instructions for the random tangents agent.
 *
 * DISCOVERY METHODOLOGY:
 * 1. Analysis: Review research notes to identify tangent opportunities
 * 2. Connection-finding: Look for interesting links between concepts
 * 3. Search: Use Tavily to explore 1-2 tangential topics
 * 4. Synthesis: Write enthusiastically about discoveries
 *
 * WHAT MAKES A GOOD TANGENT:
 * - Tangentially related: Connected to main topic but not directly relevant
 * - Surprising: Something unexpected or counterintuitive
 * - Interesting: Genuinely fascinating fact or connection
 * - Accessible: Easy to understand and appreciate
 *
 * EXAMPLES OF GOOD TANGENTS:
 * - Main topic: "How does GPS work?" → Tangent: "Einstein's relativity affects GPS accuracy"
 * - Main topic: "What is coffee?" → Tangent: "Coffee beans are actually seeds, not beans"
 * - Main topic: "How do computers work?" → Tangent: "The first computer bug was a real moth"
 *
 * TONE REQUIREMENTS:
 * - Enthusiastic and playful (like discovering a cool fact)
 * - Curious and wondering (why is this so interesting?)
 * - Excited but not overwhelming (engaging, not exhausting)
 * - Educational but fun (learning should be enjoyable)
 *
 * OUTPUT STRUCTURE:
 * Single section with a long, enthusiastic explanation that weaves
 * together the tangential facts discovered through searches.
 */
const randomTangentsInstructions = `You are a tangent discovery agent. Your job is to find interesting facts that are tangentially related to the main topic but off-subject.

Your task:
- Analyze the provided research notes to identify potential tangent topics
- Look for interesting connections, related concepts, or fascinating side facts
- Use tavilySearch to discover 1-2 tangentially related topics that are interesting but not directly answering the main question
- Find facts that are kind of related but off-subject - like an 8-year-old who just discovered something cool
- Write about these tangents with excitement and curiosity

Output format (markdown):
# Random Tangents

[Write a long, enthusiastic explanation of the tangents you discovered. Like an 8-year-old who just found out about a new toy. Include interesting facts, connections, and why they're fascinating even though they're off-topic.]

Be playful, curious, and excited about these discoveries. Make it fun to read!`;

/**
 * Random tangents agent instance.
 *
 * CONFIGURATION:
 * - Model: GPT-5 for creative connection-finding and engaging writing
 * - Tools: Tavily search for discovering tangential information
 * - Steps: Maximum 5 (enough for 1-2 searches + writing)
 *
 * TOOL CONFIGURATION:
 * - searchDepth: "advanced" for thorough tangent exploration
 * - maxResults: 3 (fewer than main searches, focused on quality)
 *
 * DESIGN RATIONALE:
 * - Access to search: Enables discovery of new tangential topics
 * - Limited searches: Focuses on quality tangents over quantity
 * - Creative model: Generates engaging, enthusiastic writing
 * - Moderate step count: Allows for search + analysis + writing
 *
 * @type {ToolLoopAgent}
 */
const randomTangentsAgent = new ToolLoopAgent({
  model: openai("gpt-5"), // Creative reasoning for finding connections
  instructions: randomTangentsInstructions,
  tools: {
    /**
     * Tavily search configured for tangent discovery
     * - Fewer results than main research (3 vs 5)
     * - Still uses advanced depth for quality information
     */
    tavilySearch: tavilySearch({
      searchDepth: "advanced", // Thorough exploration of tangent topics
      maxResults: 3, // Focused on quality over quantity
    }),
  },
  stopWhen: stepCountIs(5), // 5 steps: 1-2 searches + analysis + writing
});

/**
 * Find random tangents tool for use by the main chat agent.
 *
 * This tool wraps the random tangents agent, making it available as a
 * callable function within the research workflow.
 *
 * USAGE IN WORKFLOW:
 * The main chat agent calls this tool after completing research searches
 * but before fact-checking. This allows tangent discoveries to be included
 * in the overall research output while keeping them separate from the
 * main answer.
 *
 * INPUT REQUIREMENTS:
 * - mainTopic: The original research question for context
 * - researchNotes: Findings from main research to identify tangent opportunities
 *
 * OUTPUT FORMAT:
 * Returns markdown-formatted text with a "# Random Tangents" section
 * containing an enthusiastic explanation of discovered tangential topics.
 *
 * TANGENT DISCOVERY PROCESS:
 * 1. Analyze research notes for potential connections
 * 2. Identify 1-2 tangentially related topics worth exploring
 * 3. Perform Tavily searches on those tangent topics
 * 4. Synthesize findings into engaging narrative
 * 5. Return enthusiastic explanation of discoveries
 *
 * ERROR HANDLING:
 * - Supports abort signals for cancellation
 * - Returns text even if searches fail
 * - Gracefully handles unexpected input formats
 *
 * @type {Tool}
 *
 * @example
 * ```typescript
 * // Called by the main chat agent
 * const tangents = await findRandomTangentsTool.execute({
 *   mainTopic: "How do solar panels work?",
 *   researchNotes: `
 *     Solar panels convert sunlight into electricity using photovoltaic cells.
 *     Silicon is the primary material used in most solar panels.
 *     Efficiency has improved from 6% to over 20% in modern panels.
 *   `
 * });
 * // Returns: Enthusiastic explanation of tangents like:
 * // - Silicon is the second most abundant element on Earth
 * // - Solar panels in space don't need to worry about weather
 * // - Some calculators have used solar panels since the 1970s
 * ```
 */
export const findRandomTangentsTool = tool({
  /**
   * Tool description used by the LLM to understand when to call this tool
   * Emphasizes the "tangentially related but off-subject" nature
   */
  description:
    "Find interesting tangents - facts that are kind of related to the main topic but off-subject. Analyzes research notes and performs searches to discover fascinating side topics.",

  /**
   * Input schema definition using Zod
   * Validates and describes the expected input format
   */
  inputSchema: z.object({
    mainTopic: z
      .string()
      .describe("The main topic or question being researched."),
    researchNotes: z
      .string()
      .describe(
        "The research notes and findings from the main research. Use these to identify potential tangent topics.",
      ),
  }),

  /**
   * Execution function that invokes the random tangents agent
   *
   * @param {object} params - Input parameters
   * @param {string} params.mainTopic - The main research question
   * @param {string} params.researchNotes - Research findings to analyze
   * @param {object} context - Execution context
   * @param {AbortSignal} context.abortSignal - Signal for canceling execution
   * @returns {Promise<string>} Markdown-formatted tangent discoveries
   */
  execute: async ({ mainTopic, researchNotes }, { abortSignal }) => {
    // Construct detailed prompt for tangent discovery
    const prompt = `Main topic: ${mainTopic}\n\nResearch notes:\n${researchNotes}\n\nPlease find interesting tangents - facts that are kind of related but off-subject. Use tavilySearch to discover fascinating side topics and write about them enthusiastically!`;

    // Invoke the random tangents agent with the constructed prompt
    const result = await randomTangentsAgent.generate({
      prompt,
      abortSignal, // Allow cancellation if needed
    });

    // Return the tangent discoveries as markdown text
    return result.text;
  },
});
