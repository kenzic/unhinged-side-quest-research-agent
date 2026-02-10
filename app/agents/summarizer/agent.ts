/**
 * Summarizer Agent - Final Answer Synthesis Specialist
 *
 * This agent creates the final, verified answer to the user's question
 * by synthesizing fact-checked information into a concise, accurate summary.
 * It serves as the last step in the research workflow, ensuring the output
 * is both informative and trustworthy.
 *
 * PURPOSE:
 * - Synthesize verified facts into a coherent answer
 * - Filter out unverified or contradicted information
 * - Create concise summaries that directly answer the question
 * - Maintain factual accuracy in final output
 *
 * QUALITY STANDARDS:
 * - Uses ONLY verified claims (✅) from fact-checking
 * - Ignores uncertain (⚠️) and contradicted (❌) claims
 * - Focuses on answering the original question
 * - Balances completeness with conciseness
 *
 * WORKFLOW POSITION:
 * Called as the final step after fact-checking is complete. This ensures
 * the final answer contains only verified, trustworthy information.
 *
 * @module agents/summarizer
 */

import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * Instructions for the summarizer agent.
 *
 * SUMMARIZATION METHODOLOGY:
 * 1. Input analysis: Review all fact-checked findings
 * 2. Filtering: Extract only verified claims (✅ VERIFIED)
 * 3. Synthesis: Combine verified facts into coherent narrative
 * 4. Answer generation: Create focused response to original question
 *
 * CLAIM SELECTION CRITERIA:
 * - ✅ VERIFIED claims: Always include
 * - ⚠️ UNCERTAIN claims: Exclude unless critical for context
 * - ❌ CONTRADICTED claims: Never include
 *
 * SPECIAL CASES:
 * - If uncertain claim is critical: Include with explicit caveat
 *   Example: "While sources are unclear, it appears that..."
 * - If no verified claims: Acknowledge limitation honestly
 *   Example: "The available sources don't provide conclusive information about..."
 *
 * WRITING GUIDELINES:
 * - Direct and factual tone (not playful like tangents)
 * - Focus on answering the specific question asked
 * - Use clear, accessible language
 * - Maintain appropriate technical depth for topic
 * - Keep it concise (1-2 paragraphs typically)
 *
 * OUTPUT STRUCTURE:
 * Single section with a focused paragraph that directly answers
 * the original question using only verified information.
 */
const summarizerInstructions = `You are a summarizer agent. Your job is to create concise, accurate summaries based on fact-checked information.

Your task:
- Review the fact-checked findings provided
- Focus ONLY on verified claims (✅ VERIFIED)
- Ignore uncertain or contradicted claims unless explicitly needed for context
- Create a clear, concise summary that answers the original question
- Use only factual, verified information

Output format (markdown):
# Final Answer

[Your concise summary paragraph here, using only verified facts]

Keep it focused and factual. Do not include speculation or unverified claims.`;

/**
 * Summarizer agent instance.
 *
 * CONFIGURATION:
 * - Model: GPT-5 for nuanced synthesis of verified information
 * - Tools: None (focused on synthesis, not discovery)
 * - Steps: Maximum 5 (sufficient for analysis and writing)
 *
 * DESIGN RATIONALE:
 * - No external tools: Ensures summary is based solely on provided facts
 * - Low step count: Summarization is synthesis, not exploration
 * - Stateless: Each invocation is independent
 * - Focused prompt: Clear instructions for quality output
 *
 * QUALITY ASSURANCE:
 * The agent is specifically instructed to ignore unverified claims,
 * which acts as a final quality control step before presenting
 * information to the user.
 *
 * @type {ToolLoopAgent}
 */
const summarizerAgent = new ToolLoopAgent({
  model: openai("gpt-5"), // Advanced reasoning for synthesis
  instructions: summarizerInstructions,
  tools: {}, // No external tools - synthesizes only provided information
  stopWhen: stepCountIs(5), // 5 steps sufficient for analysis + writing
});

/**
 * Summarize tool for use by the main chat agent.
 *
 * This tool wraps the summarizer agent, making it available as a
 * callable function within the research workflow.
 *
 * USAGE IN WORKFLOW:
 * The main chat agent calls this tool as the final step, after
 * fact-checking is complete. This ensures the final answer contains
 * only verified, trustworthy information.
 *
 * INPUT REQUIREMENTS:
 * - factCheckedFindings: Markdown-formatted fact-check results
 *   Should include all three categories (verified, uncertain, contradicted)
 * - originalQuestion: (Optional) The user's original question for context
 *   Helps focus the summary on answering the specific question
 *
 * OUTPUT FORMAT:
 * Returns markdown-formatted text with a "# Final Answer" section
 * containing a concise paragraph that answers the original question
 * using only verified facts.
 *
 * VERIFICATION GUARANTEE:
 * By only including verified claims (✅), this tool provides a strong
 * guarantee that the final answer is based on fact-checked, trustworthy
 * information from reliable sources.
 *
 * ERROR HANDLING:
 * - Supports abort signals for cancellation
 * - Returns text even if synthesis is incomplete
 * - Gracefully handles missing original question
 * - Can handle cases where no claims are verified
 *
 * @type {Tool}
 *
 * @example
 * ```typescript
 * // Called by the main chat agent
 * const finalAnswer = await summarizeTool.execute({
 *   factCheckedFindings: `
 *     ## Verified Claims
 *     - Python was created by Guido van Rossum in 1991 (Source: python.org)
 *     - Python emphasizes code readability (Source: PEP 8)
 *
 *     ## Uncertain Claims
 *     - Python is the most popular language (Sources conflict)
 *
 *     ## Contradicted Claims
 *     - None
 *   `,
 *   originalQuestion: "When was Python created?"
 * });
 * // Returns: "# Final Answer\n\nPython was created by Guido van Rossum
 * // in 1991. The language emphasizes code readability and clean syntax..."
 * ```
 */
export const summarizeTool = tool({
  /**
   * Tool description used by the LLM to understand when to call this tool
   * Emphasizes the use of only verified claims
   */
  description:
    "Summarize fact-checked findings into a concise final answer. Uses only verified claims from the fact-check results.",

  /**
   * Input schema definition using Zod
   * Validates and describes the expected input format
   */
  inputSchema: z.object({
    factCheckedFindings: z
      .string()
      .describe(
        "The fact-checked findings (markdown format) to summarize into a final answer.",
      ),
    originalQuestion: z
      .string()
      .optional()
      .describe("The original question being answered (for context)."),
  }),

  /**
   * Execution function that invokes the summarizer agent
   *
   * @param {object} params - Input parameters
   * @param {string} params.factCheckedFindings - Fact-check results to summarize
   * @param {string} [params.originalQuestion] - Original question for context
   * @param {object} context - Execution context
   * @param {AbortSignal} context.abortSignal - Signal for canceling execution
   * @returns {Promise<string>} Markdown-formatted final answer
   */
  execute: async (
    { factCheckedFindings, originalQuestion },
    { abortSignal },
  ) => {
    /**
     * Construct prompt with optional original question
     * Including the original question helps focus the summary
     * on answering the specific question asked
     */
    const prompt = originalQuestion
      ? `Original question: ${originalQuestion}\n\nFact-checked findings:\n${factCheckedFindings}\n\nPlease create a summary using only verified claims.`
      : `Fact-checked findings:\n${factCheckedFindings}\n\nPlease create a summary using only verified claims.`;

    // Invoke the summarizer agent with the constructed prompt
    const result = await summarizerAgent.generate({
      prompt,
      abortSignal, // Allow cancellation if needed
    });

    // Return the final answer as markdown text
    return result.text;
  },
});
