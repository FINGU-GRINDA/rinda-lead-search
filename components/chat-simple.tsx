"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { Messages } from "./messages";
import { ArrowUpIcon, StopIcon } from "./icons";
import { useTranslation } from "@/lib/use-translation";
import cn from "classnames";
import { motion } from "framer-motion";
import { TooltipWrapper } from "./tooltip-wrapper";
import { HistorySidebar } from "./history-sidebar";
import { HistoryManager, SearchHistory } from "@/lib/history-manager";
import { WebsiteAnalysisModal } from "./website-analysis-modal";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import { useRef } from "react";
import { SearchSuggestions } from "./search-suggestions";
import { SyncDriveButton } from "./sync-drive-button";

export function ChatSimple() {
  const { t, locale } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: "primary",
    onError: (error) => {
      console.error("Chat error:", error);
      // Show more detailed error message if available
      const errorMessage = error?.message || error?.toString() || t("errors.generic");
      toast.error(errorMessage);
    },
  });

  const isGeneratingResponse = ["streaming", "submitted"].includes(status);
  const hasMessages = messages.length > 0;

  const handleSubmit = () => {
    if (input.trim() === "") {
      return;
    }

    sendMessage(
      { text: input.trim() },
      {
        body: {
          surface: "rinda-search",
        },
      }
    );
    setInput("");
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const examplePrompts = [
    "헬스케어 업종 리드 찾아줘",
    "Find leads in AI industry",
    "최근 제안서에서 연락처 추출",
    "Analyze document for contacts",
  ];

  const handleSelectHistory = (history: SearchHistory) => {
    // Set the query as input
    setInput(history.query);
    // Optionally auto-submit the query
    // sendMessage({ text: history.query }, { body: { surface: "rinda-search" } });
  };

  const handleAnalyzeWebsite = async (url: string) => {
    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Format the analysis as a message to send to the chat
        const message = `${locale === 'ko' ? '웹사이트 분석 완료:' : 'Website analysis completed:'} ${url}\n\n${locale === 'ko' ? 'AI가 다음 정보를 찾았어요:' : 'AI found the following information:'}\n\n${result.rawText}`;
        sendMessage(
          { text: message },
          {
            body: {
              surface: "rinda-search",
            },
          }
        );
        toast.success(locale === 'ko' ? '웹사이트 분석 완료!' : 'Website analyzed successfully!');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      toast.error(locale === 'ko' ? '웹사이트 분석에 실패했어요' : 'Failed to analyze website');
    }
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.SEARCH,
      action: () => inputRef.current?.focus(),
    },
    {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      action: () => {
        if (showSuggestions) setShowSuggestions(false);
        else if (isHistoryOpen) setIsHistoryOpen(false);
        else if (isWebsiteModalOpen) setIsWebsiteModalOpen(false);
        else if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
        else if (input) setInput("");
      },
    },
    {
      ...GLOBAL_SHORTCUTS.HELP,
      action: () => setIsShortcutsModalOpen(true),
    },
    {
      ...GLOBAL_SHORTCUTS.NEW_SEARCH,
      action: () => {
        setInput("");
        inputRef.current?.focus();
      },
    },
    {
      ...GLOBAL_SHORTCUTS.TOGGLE_HISTORY,
      action: () => setIsHistoryOpen(!isHistoryOpen),
    },
    {
      ...GLOBAL_SHORTCUTS.ANALYZE_WEBSITE,
      action: () => setIsWebsiteModalOpen(true),
    },
  ]);

  return (
    <div className="flex h-screen flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4">
          {!hasMessages ? (
            /* Hero Section - Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex min-h-[70vh] flex-col items-center justify-center text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  Build something with
                  <br />
                  RINDA Search
                </h1>
                <TooltipWrapper content={locale === 'ko' ? '검색 기록 보기' : 'View search history'}>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:scale-110"
                  >
                    <svg
                      className="w-5 h-5 text-zinc-700 dark:text-zinc-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </TooltipWrapper>
              </div>
              <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
                AI로 리드를 발굴하고 고객사 정보를 검색하세요
                <br />
                Create lead intelligence by chatting with AI
              </p>

              {/* Example Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mb-8">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                    }}
                    className="px-4 py-2 text-sm rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Messages Display */
            <div className="py-8">
              <Messages messages={messages} status={status} />
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Bar */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <SyncDriveButton />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="relative">
            {/* Main Input Container */}
            <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 dark:bg-zinc-950 px-4 py-3 shadow-2xl border border-zinc-800 dark:border-zinc-700">
              {/* Left Icons */}
              <div className="flex items-center gap-2">
                <TooltipWrapper content={t('chat.analyzeWebsiteTooltip')}>
                  <button
                    onClick={() => setIsWebsiteModalOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </TooltipWrapper>
                <TooltipWrapper content={t('chat.addFileTooltip')}>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>
                </TooltipWrapper>
              </div>

              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => !hasMessages && setShowSuggestions(true)}
                  onBlur={() => {
                    // Delay to allow clicking on suggestions
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isGeneratingResponse && input.trim() !== "") {
                        handleSubmit();
                      }
                    }
                  }}
                  placeholder={
                    hasMessages
                      ? t("chat.placeholder")
                      : "Ask RINDA to find leads, extract contacts..."
                  }
                  className="w-full resize-none bg-transparent text-white placeholder:text-zinc-500 outline-none text-base leading-relaxed min-h-[24px] max-h-[200px]"
                  rows={1}
                  style={{
                    height: "auto",
                    overflow: "hidden",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-2">
                <TooltipWrapper content={t('chat.voiceInputTooltip')}>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                </TooltipWrapper>
                <TooltipWrapper content={t('chat.sendMessageTooltip')}>
                  <button
                    onClick={() => {
                      if (isGeneratingResponse) {
                        stop();
                        return;
                      }
                      handleSubmit();
                    }}
                    disabled={!isGeneratingResponse && input.trim() === ""}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      isGeneratingResponse
                        ? "bg-white text-zinc-900 hover:bg-zinc-100"
                        : input.trim() === ""
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-white text-zinc-900 hover:bg-zinc-100 hover:-translate-y-0.5"
                    )}
                  >
                    {isGeneratingResponse ? (
                      <StopIcon size={18} />
                    ) : (
                      <ArrowUpIcon size={18} />
                    )}
                  </button>
                </TooltipWrapper>
              </div>
            </div>

            {/* Search Suggestions */}
            {!hasMessages && (
              <SearchSuggestions
                isVisible={showSuggestions}
                searchQuery={input}
                onSelectSuggestion={handleSelectSuggestion}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistory={handleSelectHistory}
      />

      {/* Website Analysis Modal */}
      <WebsiteAnalysisModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onAnalyze={handleAnalyzeWebsite}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
