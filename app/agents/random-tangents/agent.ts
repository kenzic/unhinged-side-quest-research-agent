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

// NOTE: replace with real tool. This is a placeholder to prevent import errors.
export const findRandomTangentsTool = () => null;
