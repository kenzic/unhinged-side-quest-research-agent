import { createAgentUIStreamResponse } from "ai";
import { UIMessage } from "ai";
import { createChatAgent } from "../../agents/chat/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const agent = createChatAgent();

    // Return streaming response compatible with useChat
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
