"use client";

import cn from "classnames";
import Markdown from "react-markdown";
import { markdownComponents } from "./markdown-components";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "./icons";
import { UIMessage } from "ai";
import { TypingIndicator } from "./typing-indicator";
import { useTranslation } from "@/lib/use-translation";
import { LeadTableArtifact } from "./lead-table-artifact";
import { Lead } from "@/lib/schemas/lead";
import { useArtifact } from "@/lib/contexts/artifact-context";

interface ReasoningPart {
  type: "reasoning";
  text: string;
}

interface ReasoningMessagePartProps {
  part: ReasoningPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false);
    }
  }, [isReasoning]);

  return (
    <div className="rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
        <div className="flex items-center gap-2">
          <span>{isReasoning ? "Reasoning" : "Reasoned"}</span>
          {isReasoning && (
            <span className="animate-spin text-blue-400">
              <SpinnerIcon />
            </span>
          )}
        </div>
        {!isReasoning && (
          <button
            className={cn(
              "rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
              {
                "bg-zinc-200/60 dark:bg-zinc-800/80": isExpanded,
              },
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Markdown components={markdownComponents}>
              {part.text}
            </Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TextMessagePartProps {
  text: string;
}

export function TextMessagePart({ text }: TextMessagePartProps) {
  const { setArtifact } = useArtifact();

  // Try to detect and parse lead data from JSON code blocks
  const leadData = useMemo(() => {
    try {
      // Look for JSON code blocks with leads data
      const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        // Check if it's a leads array or has a leads property
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed.leads && Array.isArray(parsed.leads)) {
          return parsed.leads;
        }
      }
    } catch (e) {
      // Not valid JSON or not lead data, continue with normal rendering
    }
    return null;
  }, [text]);

  // Send lead data to artifact panel when detected
  useEffect(() => {
    if (leadData && leadData.length > 0) {
      setArtifact('leads', leadData);
    }
  }, [leadData, setArtifact]);

  if (leadData && leadData.length > 0) {
    // Remove JSON block from text for display
    const textWithoutJson = text.replace(/```json\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/g, '');

    return (
      <div className="flex flex-col gap-4">
        {textWithoutJson.trim() && (
          <Markdown components={markdownComponents}>{textWithoutJson}</Markdown>
        )}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>{leadData.length}개의 리드가 오른쪽 패널에 표시됩니다</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Markdown components={markdownComponents}>{text}</Markdown>
    </div>
  );
}

interface MessagesProps {
  messages: Array<UIMessage>;
  status: "error" | "submitted" | "streaming" | "ready";
}

export function Messages({ messages, status }: MessagesProps) {
  const { t } = useTranslation();
  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesLength = useMemo(() => messages.length, [messages]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messagesLength]);

  return (
    <div
      className="flex w-full flex-col gap-6 overflow-y-auto pr-2"
      ref={messagesRef}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex w-full", {
            "justify-end": message.role === "user",
            "justify-start": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "flex w-full max-w-3xl flex-col gap-3 rounded-2xl border p-5 text-sm leading-relaxed shadow-lg",
              {
                "ml-auto border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white":
                  message.role === "user",
                "mr-auto border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white":
                  message.role === "assistant",
              },
            )}
          >
            {message.parts.map((part, partIndex) => {
              if (part.type === "text") {
                return (
                  <TextMessagePart
                    key={`${message.id}-${partIndex}`}
                    text={part.text}
                  />
                );
              }

              if (part.type === "reasoning") {
                return (
                  <ReasoningMessagePart
                    key={`${message.id}-${partIndex}`}
                    part={part}
                    isReasoning={
                      status === "streaming" &&
                      partIndex === message.parts.length - 1
                    }
                  />
                );
              }
            })}
          </div>
        </div>
      ))}

      {status === "submitted" && <TypingIndicator />}
    </div>
  );
}
