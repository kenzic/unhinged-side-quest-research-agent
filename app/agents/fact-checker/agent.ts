/**
 * Fact-Checker Agent - Research Verification Specialist
 *
 * This agent is responsible for verifying claims and information discovered
 * during research. It acts as a quality control layer that ensures the
 * final output is based on accurate, well-supported facts.
 *
 * PURPOSE:
 * - Validate research findings against sources
 * - Identify unsupported or contradictory claims
 * - Categorize claims by confidence level
 * - Prevent misinformation from reaching final output
 *
 * WORKFLOW POSITION:
 * Called by the main chat agent after research is complete but before
 * final summarization. This ensures only verified information makes it
 * into the final answer.
 *
 * @module agents/fact-checker
 */

import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * Instructions for the fact-checker agent.
 *
 * VERIFICATION METHODOLOGY:
 * 1. Extract claims: Identify factual statements that can be verified
 * 2. Source analysis: Cross-reference claims with provided citations
 * 3. Confidence assessment: Evaluate the strength of supporting evidence
 * 4. Categorization: Sort claims into three categories
 *
 * CLAIM CATEGORIES:
 * - ✅ VERIFIED: Strong evidence from multiple sources or authoritative single source
 *   - Multiple sources agree on the claim
 *   - Single authoritative source provides clear evidence
 *   - Claim is well-established fact
 *
 * - ⚠️ UNCERTAIN: Insufficient or conflicting evidence
 *   - Sources provide conflicting information
 *   - Insufficient sources to verify claim
 *   - Claim is plausible but not definitively proven
 *
 * - ❌ CONTRADICTED: Sources disagree or actively contradict the claim
 *   - Multiple sources directly contradict the claim
 *   - Claim is not supported by any provided sources
 *   - Evidence suggests the claim is false
 *
 * OUTPUT STRUCTURE:
 * Markdown format with three sections, each listing relevant claims
 * with their supporting or contradicting evidence cited.
 */
const factCheckerInstructions = `You are a fact-checker agent. Your job is to verify claims and information from research notes.

Your task:
- Review the provided research notes and claims
- Identify key factual claims that need verification
- Cross-reference claims with the provided sources
- Mark each claim as:
  - ✅ VERIFIED: Multiple sources agree, or claim is well-supported
  - ⚠️ UNCERTAIN: Conflicting information or insufficient sources
  - ❌ CONTRADICTED: Sources disagree or claim is unsupported

Output format (markdown):
# Fact Check

## Verified Claims
- [Claim text] (Sources: [citation])

## Uncertain Claims
- [Claim text] (Reason: [why uncertain], Sources: [citation])

## Contradicted Claims
- [Claim text] (Reason: [why contradicted], Sources: [citation])

Be thorough but concise. Focus on factual accuracy.`;

/**
 * Fact-checker agent instance.
 *
 * CONFIGURATION:
 * - Model: GPT-5-mini for nuanced reasoning about claim validity
 * - Tools: None (focused on analysis of provided information)
 * - Steps: Maximum 5 (sufficient for claim extraction and categorization)
 *
 * DESIGN RATIONALE:
 * - No external tools: Ensures verification is based solely on provided sources
 * - Low step count: Fact-checking is analytical, not exploratory
 * - Stateless: Each invocation is independent
 *
 * @type {ToolLoopAgent}
 */
const factCheckerAgent = new ToolLoopAgent({
  model: openai("gpt-5-mini"), // Advanced reasoning for claim verification
  instructions: factCheckerInstructions,
  tools: {}, // No external tools - analyzes only provided information
  stopWhen: stepCountIs(5), // 5 steps sufficient for verification process
});

/**
 * Fact-check tool for use by the main chat agent.
 *
 * This tool wraps the fact-checker agent, making it available as a
 * callable function within the research workflow.
 *
 * USAGE IN WORKFLOW:
 * The main chat agent calls this tool after completing research searches
 * and before generating the final summary. This ensures that only verified
 * information makes it into the final output.
 *
 * INPUT REQUIREMENTS:
 * - researchNotes: String containing claims and their sources
 * - Should include citations or source URLs for verification
 * - Can be raw search results or formatted research notes
 *
 * OUTPUT FORMAT:
 * Returns markdown-formatted text with three sections:
 * 1. Verified Claims (✅)
 * 2. Uncertain Claims (⚠️)
 * 3. Contradicted Claims (❌)
 *
 * ERROR HANDLING:
 * - Supports abort signals for cancellation
 * - Returns text even if verification is incomplete
 * - Gracefully handles malformed input
 *
 * @type {Tool}
 *
 * @example
 * ```typescript
 * // Called by the main chat agent
 * const verifiedResults = await factCheckTool.execute({
 *   researchNotes: `
 *     Claim: Python was created in 1991
 *     Source: https://python.org/about
 *
 *     Claim: Python is the most popular language
 *     Source: Various developer surveys
 *   `
 * });
 * // Returns categorized claims with confidence levels
 * ```
 */
export const factCheckTool = tool({
  /**
   * Tool description used by the LLM to understand when to call this tool
   */
  description:
    "Fact-check research notes and claims. Verifies information against sources and identifies verified, uncertain, or contradicted claims.",

  /**
   * Input schema definition using Zod
   * Validates and describes the expected input format
   */
  inputSchema: z.object({
    researchNotes: z
      .string()
      .describe(
        "The research notes, claims, or information to fact-check. Should include sources and citations.",
      ),
  }),

  /**
   * Execution function that invokes the fact-checker agent
   *
   * @param {object} params - Input parameters
   * @param {string} params.researchNotes - Research notes to verify
   * @param {object} context - Execution context
   * @param {AbortSignal} context.abortSignal - Signal for canceling execution
   * @returns {Promise<string>} Markdown-formatted fact-check results
   */
  execute: async ({ researchNotes }, { abortSignal }) => {
    // Invoke the fact-checker agent with formatted prompt
    const result = await factCheckerAgent.generate({
      prompt: `Please fact-check the following research notes:\n\n${researchNotes}`,
      abortSignal, // Allow cancellation if needed
    });

    // Return the verification results as markdown text
    return result.text;
  },
});
