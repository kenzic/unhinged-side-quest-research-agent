"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

import { useEffect, useState } from "react";

const suggestions = [
  "What are the latest developments in quantum computing?",
  "What's the capital of Lebanon?",
  "How do octopuses change color?",
  "What is the smallest country in the world?",
  "Explain how black holes form",
];

const SuggestionInput = ({
  onSuggestionClick,
  className,
}: {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}) => {
  return (
    <Suggestions className="">
      <div className="flex-nowrap grid grid-flow-col gap-2 overflow-x-scroll whitespace-nowrap">
        {suggestions.map((suggestion) => (
          <Suggestion
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            suggestion={suggestion}
          />
        ))}
      </div>
    </Suggestions>
  );
};

const InputDemo = ({
  onSubmit,
  status,
  value,
}: {
  onSubmit: (message: { text: string | undefined }) => void;
  status: "ready" | "streaming" | "submitted" | "error" | undefined;
  value: string;
}) => {
  const [text, setText] = useState<string>(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);

    if (!hasText) {
      return;
    }

    onSubmit({ text: message.text || "" });
    setText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    onSubmit({ text: suggestion });
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
      <PromptInputHeader>
        <SuggestionInput
          onSuggestionClick={handleSuggestionClick}
          className="gap-5"
        />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={!text && !status} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
};

export default InputDemo;
