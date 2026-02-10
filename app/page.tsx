"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useMemo, Fragment } from "react";
import type { ToolUIPart } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from "@/components/ai-elements/sources";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from "@/components/ai-elements/task";
import { MessageSquare, Sparkles, Compass } from "lucide-react";
import InputDemo from "@/components/prompt-input";
import { TooltipProvider } from "@/components/ui/tooltip";

interface SearchLogEntry {
  query: string;
  reason: string;
  timestamp: Date;
}

interface SourceInfo {
  url: string;
  title: string;
}

// Extract sources from a message's parts
const extractSourcesFromMessage = (message: any): SourceInfo[] => {
  const sources: SourceInfo[] = [];

  message.parts.forEach((part: any) => {
    // Check for source-url parts
    if (part.type === "source-url") {
      sources.push({
        url: part.url || "",
        title: part.title || part.url || "Source",
      });
    }

    // Extract from tool outputs (especially tavilySearch)
    if (part.type.startsWith("tool-")) {
      const output = part.output;
      if (output) {
        // Tavily search results typically have a results array
        if (Array.isArray(output.results)) {
          output.results.forEach((result: any) => {
            if (result.url) {
              sources.push({
                url: result.url,
                title: result.title || result.url || "Source",
              });
            }
          });
        }
        // Also check if output itself is an array
        else if (Array.isArray(output)) {
          output.forEach((result: any) => {
            if (result.url) {
              sources.push({
                url: result.url,
                title: result.title || result.url || "Source",
              });
            }
          });
        }
        // Check for direct url/title properties
        else if (output.url) {
          sources.push({
            url: output.url,
            title: output.title || output.url || "Source",
          });
        }
      }
    }
  });

  // Deduplicate by URL
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) {
      return false;
    }
    seen.add(source.url);
    return true;
  });
};

// Get current tool activity for loader display
const getCurrentToolActivity = (messages: any[]): string[] => {
  const activities: string[] = [];

  // Focus on the most recent message's tool parts
  if (messages.length === 0) {
    return activities;
  }

  const lastMessage = messages[messages.length - 1];
  const activeToolParts = lastMessage.parts.filter(
    (part: any) =>
      part.type.startsWith("tool-") &&
      (part.state === "input-available" ||
        part.state === "input-streaming" ||
        part.state === "output-available"),
  );

  activeToolParts.forEach((part: any) => {
    const toolName = part.type.replace("tool-", "");
    const displayName =
      toolName === "tavilySearch"
        ? "Searching web"
        : toolName === "factCheck"
          ? "Fact-checking"
          : toolName === "summarize"
            ? "Summarizing"
            : toolName === "findRandomTangents"
              ? "Finding tangents"
              : toolName;

    if (part.state === "input-available" || part.state === "input-streaming") {
      activities.push(displayName);
    }
  });

  return activities;
};

export default function Chat() {
  const [sideQuestCount, setSideQuestCount] = useState(0);
  const [searchLog, setSearchLog] = useState<SearchLogEntry[]>([]);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, setMessages } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  // Get loader content based on current tool activity
  const loaderContent = useMemo(() => {
    if (!isLoading) return null;

    const activities = getCurrentToolActivity(messages);
    const hasActivities = activities.length > 0;

    // Get tool parts from the most recent message
    const recentToolParts =
      messages.length > 0
        ? messages[messages.length - 1]?.parts.filter((p: any) =>
            p.type.startsWith("tool-"),
          ) || []
        : [];

    return {
      title: hasActivities ? activities.join(", ") : "Researching...",
      activities: hasActivities ? activities : ["Starting research..."],
      toolParts: recentToolParts,
    };
  }, [isLoading, messages]);

  // Find the most recent tool part across all messages
  const mostRecentToolPart = useMemo(() => {
    let lastToolPart: { messageId: string; partIndex: number } | null = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      for (let j = message.parts.length - 1; j >= 0; j--) {
        const part = message.parts[j];
        if (part.type.startsWith("tool-")) {
          lastToolPart = { messageId: message.id, partIndex: j };
          break;
        }
      }
      if (lastToolPart) break;
    }

    return lastToolPart;
  }, [messages]);

  // Parse assistant messages for side quests and search log
  useEffect(() => {
    const processedMessageIds = new Set<string>();

    messages.forEach((message) => {
      if (
        message.role === "assistant" &&
        !processedMessageIds.has(message.id)
      ) {
        processedMessageIds.add(message.id);

        // Track searches from tool calls
        const searchesInThisMessage: Array<{
          query: string;
          reason: string;
          isTangent: boolean;
        }> = [];

        // Parse parts for tool calls and text
        message.parts.forEach((part) => {
          // Detect tangent searches from tool calls
          if (part.type === "tool-tavilySearch") {
            const toolCall = part as any;
            const query =
              toolCall.toolCall?.args?.query ||
              toolCall.query ||
              "Unknown query";
            const reason = toolCall.toolCall?.args?.reason || "Research query";

            // Detect if this is a tangent search by checking context
            // Look for keywords that suggest distraction
            const isTangent =
              query.toLowerCase().includes("tangent") ||
              query.toLowerCase().includes("interesting") ||
              query.toLowerCase().includes("side") ||
              toolCall.toolCall?.args?.reason
                ?.toLowerCase()
                .includes("tangent") ||
              toolCall.toolCall?.args?.reason
                ?.toLowerCase()
                .includes("distracted") ||
              toolCall.toolCall?.args?.reason
                ?.toLowerCase()
                .includes("side quest");

            searchesInThisMessage.push({ query, reason, isTangent });

            // Add to search log
            setSearchLog((prev) => {
              if (
                prev.some(
                  (entry) => entry.query === query && entry.reason === reason,
                )
              ) {
                return prev;
              }
              return [...prev, { query, reason, timestamp: new Date() }];
            });
          }

          // Parse text parts for side quests and search log
          if (part.type === "text") {
            const text = part.text;

            // Count side quests (look for "Probably irrelevant but interesting" section)
            if (text.includes("Probably irrelevant but interesting")) {
              const sideQuestMatch = text.match(
                /Probably irrelevant but interesting[:\-]?\s*([\s\S]+?)(?=\n\n|\nSearches|$)/,
              );
              if (sideQuestMatch) {
                const sideQuests = sideQuestMatch[1]
                  .split("\n")
                  .filter(
                    (line) =>
                      line.trim().startsWith("-") ||
                      line.trim().startsWith("•"),
                  )
                  .map((line) => line.replace(/^[-•]\s*/, "").trim())
                  .filter((line) => line.length > 0);
                setSideQuestCount((prev) => prev + sideQuests.length);
              }
            }

            // Also detect tangent searches from text mentions
            if (
              text.includes("got distracted") ||
              text.includes("side quest") ||
              text.includes("tangent")
            ) {
              // Increment counter for each tangent mention
              const tangentMentions = (
                text.match(/got distracted|side quest|tangent/gi) || []
              ).length;
              setSideQuestCount((prev) => prev + Math.min(tangentMentions, 2)); // Cap at 2 per message
            }

            // Extract search log entries from text
            if (text.includes("Searches I ran")) {
              const searchMatch = text.match(
                /Searches I ran[:\-]?\s*([\s\S]+?)(?=\n\n|$)/,
              );
              if (searchMatch) {
                const searchLines = searchMatch[1]
                  .split("\n")
                  .filter(
                    (line) =>
                      line.trim().startsWith("-") ||
                      line.trim().startsWith("•"),
                  )
                  .map((line) => line.replace(/^[-•]\s*/, "").trim())
                  .filter((line) => line.length > 0);

                searchLines.forEach((line) => {
                  // Try to parse "query - reason" or "query: reason" format
                  const parts = line.split(/[-:]/).map((p) => p.trim());
                  if (parts.length >= 2) {
                    const query = parts[0];
                    const reason = parts.slice(1).join(" - ");
                    setSearchLog((prev) => {
                      // Avoid duplicates
                      if (
                        prev.some(
                          (entry) =>
                            entry.query === query && entry.reason === reason,
                        )
                      ) {
                        return prev;
                      }
                      return [
                        ...prev,
                        { query, reason, timestamp: new Date() },
                      ];
                    });
                  } else if (parts.length === 1 && parts[0]) {
                    // Just query, no reason
                    setSearchLog((prev) => {
                      if (
                        prev.some(
                          (entry) => entry.query === parts[0] && !entry.reason,
                        )
                      ) {
                        return prev;
                      }
                      return [
                        ...prev,
                        {
                          query: parts[0],
                          reason: "No reason provided",
                          timestamp: new Date(),
                        },
                      ];
                    });
                  }
                });
              }
            }
          }
        });

        // Count tangent searches from tool calls
        const tangentSearches = searchesInThisMessage.filter(
          (s) => s.isTangent,
        ).length;
        if (tangentSearches > 0) {
          setSideQuestCount((prev) => prev + tangentSearches);
        }
      }
    });
  }, [messages]);

  const handleReset = () => {
    setMessages([]);
    setSideQuestCount(0);
    setSearchLog([]);
  };

  const handleSubmit = (message: { text: string | undefined }) => {
    if (message.text) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  return (
    <TooltipProvider>
      {/* Full page background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/20" />

        {/* Floating gradient orbs */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/10 dark:bg-green-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Content container */}
      <div className="relative flex h-screen w-screen max-w-screen-lg mx-auto">
        {/* Main Chat Area */}
        <div className="relative flex-1 flex flex-col z-10">
          {/* Header */}
          <div className="relative border-b border-emerald-200/50 dark:border-emerald-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-6 flex items-center justify-between overflow-hidden shadow-sm">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-green-500/20 animate-pulse" />

            <div className="relative flex items-center gap-3">
              {/* Icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 dark:bg-emerald-400 blur-lg opacity-30 rounded-full" />
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 p-2.5 rounded-xl shadow-lg">
                  <Compass
                    className="size-6 text-white animate-spin"
                    style={{ animationDuration: "8s" }}
                  />
                </div>
              </div>

              {/* Title with gradient text */}
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 dark:from-emerald-400 dark:via-teal-400 dark:to-green-400 bg-clip-text text-transparent">
                  Unhinged Side Quest Research Agent
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  AI-Powered Research with a Twist
                </p>
              </div>
            </div>

            {/* Badge */}
            <div className="relative">
              <div className="px-3 py-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 rounded-full shadow-sm">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  Ready to Explore
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <Conversation className="flex-1 max-w-screen-lg w-screen bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
            <ConversationContent className="max-w-screen-lg w-screen">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Ask me anything!"
                  description="I'll research it for you."
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-muted-foreground text-2xl font-bold">
                      Start a conversation
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Ask me anything! I&apos;ll research it for you. Although,
                      I might get distracted by interesting side quests.
                    </p>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message) => {
                  const sources = extractSourcesFromMessage(message);
                  const hasTextParts = message.parts.some(
                    (p) => p.type === "text",
                  );

                  return (
                    <Fragment key={message.id}>
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <Message
                              from={message.role}
                              key={`${message.id}-${i}`}
                            >
                              <MessageContent>
                                <MessageResponse>{part.text}</MessageResponse>
                                {message.role === "assistant" &&
                                  sources.length > 0 && (
                                    <Sources>
                                      <SourcesTrigger count={sources.length} />
                                      <SourcesContent>
                                        {sources.map((source, idx) => (
                                          <Source
                                            key={`${message.id}-source-${idx}`}
                                            href={source.url}
                                            title={source.title}
                                          />
                                        ))}
                                      </SourcesContent>
                                    </Sources>
                                  )}
                              </MessageContent>
                            </Message>
                          );
                        }
                        if (part.type.startsWith("tool-")) {
                          const toolPart = part as ToolUIPart;

                          return (
                            <Message
                              from={message.role}
                              key={`${message.id}-${i}`}
                              className="w-full max-w-[100%]"
                            >
                              <MessageContent>
                                <Tool defaultOpen={false}>
                                  <ToolHeader
                                    type={toolPart.type}
                                    state={toolPart.state}
                                  />
                                  <ToolContent>
                                    {toolPart.input !== undefined ? (
                                      <ToolInput input={toolPart.input} />
                                    ) : null}
                                    {toolPart.output !== undefined ||
                                    toolPart.errorText ? (
                                      <ToolOutput
                                        output={toolPart.output}
                                        errorText={toolPart.errorText}
                                      />
                                    ) : null}
                                  </ToolContent>
                                </Tool>
                              </MessageContent>
                            </Message>
                          );
                        }
                        return null;
                      })}
                      {/* Show sources for assistant messages even if no text parts */}
                      {message.role === "assistant" &&
                        sources.length > 0 &&
                        !hasTextParts && (
                          <Message
                            from="assistant"
                            key={`${message.id}-sources`}
                          >
                            <MessageContent>
                              <Sources>
                                <SourcesTrigger count={sources.length} />
                                <SourcesContent>
                                  {sources.map((source, idx) => (
                                    <Source
                                      key={`${message.id}-source-${idx}`}
                                      href={source.url}
                                      title={source.title}
                                    />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            </MessageContent>
                          </Message>
                        )}
                    </Fragment>
                  );
                })
              )}
              {loaderContent && (
                <Message from="assistant">
                  <MessageContent>
                    <Task defaultOpen={true}>
                      <TaskTrigger title={loaderContent.title} />
                      <TaskContent>
                        {loaderContent.activities.map((activity, idx) => (
                          <TaskItem key={`activity-${idx}`}>
                            {activity}
                          </TaskItem>
                        ))}
                        {loaderContent.toolParts.map(
                          (part: any, idx: number) => {
                            const toolName = part.type.replace("tool-", "");
                            const displayName =
                              toolName === "tavilySearch"
                                ? "Web search"
                                : toolName === "factCheck"
                                  ? "Fact-checking"
                                  : toolName === "summarize"
                                    ? "Summarizing"
                                    : toolName === "findRandomTangents"
                                      ? "Finding tangents"
                                      : toolName;
                            const stateLabel =
                              part.state === "input-available" ||
                              part.state === "input-streaming"
                                ? "Running"
                                : part.state === "output-available"
                                  ? "Completed"
                                  : part.state === "output-error"
                                    ? "Error"
                                    : "";

                            return (
                              <TaskItem key={`tool-${idx}`}>
                                {displayName}
                                {stateLabel && ` - ${stateLabel}`}
                              </TaskItem>
                            );
                          },
                        )}
                      </TaskContent>
                    </Task>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Input */}
          <div className="relative max-w-screen-lg w-screen p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
            <InputDemo onSubmit={handleSubmit} status={status} value={input} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
