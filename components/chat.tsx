"use client";

import cn from "classnames";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Messages } from "./messages";
import { Footnote } from "./footnote";
import { ArrowUpIcon, StopIcon } from "./icons";
import { Input } from "./input";
import { TooltipWrapper } from "./tooltip-wrapper";
import { AgentStatusBadge } from "./agent-status-badge";
import { useTranslation } from "@/lib/use-translation";

interface SyncStatus {
  status: string;
  progress: number;
  filesFound?: number;
  filesProcessed?: number;
}

const quickPrompts = [
  {
    label: "이번 주 업로드된 신규 기업 요약 / Summarize new companies uploaded this week",
    value:
      "이번 주에 구글 드라이브에 업로드된 신규 기업을 요약해줘. Summarize the newest companies uploaded this week and highlight why they matter.",
  },
  {
    label: "헬스케어 디렉터 리드 / Healthcare director persona leads",
    value:
      "캘리포니아에 있는 헬스케어 기업 중 Director 이상 직함의 리드를 찾아줘. Include emails or phones when available.",
  },
  {
    label: "사이버보안 리드 (EMEA) / Cybersecurity leads in EMEA",
    value:
      "최근 제안서에서 파생된 EMEA 사이버보안 리드를 정리해줘. Cite the supporting files.",
  },
  {
    label: "AI 스타트업 후속 아웃리치 / Follow-up angles for AI startups",
    value:
      "시리즈 B 투자를 받은 AI 스타트업을 대상으로 후속 아웃리치 각도를 제안해줘. Provide 3 talking points.",
  },
];

export function Chat() {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [indexedDocuments, setIndexedDocuments] = useState<number | null>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: "primary",
    onError: () => {
      toast.error(t("errors.generic"));
    },
  });

  const isGeneratingResponse = ["streaming", "submitted"].includes(status);
  const hasMessages = messages.length > 0;

  const dispatchMessage = (value: string) => {
    sendMessage(
      { text: value },
      {
        body: {
          surface: "lead-search-agent",
        },
      },
    );
  };

  const handleSubmit = () => {
    if (input.trim() === "") {
      return;
    }

    dispatchMessage(input.trim());
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isGeneratingResponse) {
      toast.info(t("chat.agentThinking"));
      return;
    }

    dispatchMessage(prompt);
  };

  const handleSyncDrive = async () => {
    if (isSyncing) {
      toast.info(t("header.syncing"));
      return;
    }

    setIsSyncing(true);
    toast.info(t("notifications.syncStarted"));

    try {
      const response = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to start sync");
      }

      const { jobId } = await response.json();

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/drive/status/${jobId}`);
          if (!statusRes.ok) {
            throw new Error("Failed to check sync status");
          }

          const { job } = await statusRes.json();

          setSyncStatus({
            status: job.status,
            progress: job.progress,
            filesFound: job.filesFound,
            filesProcessed: job.filesProcessed,
          });

          setIndexedDocuments((prev) => job.filesProcessed ?? job.filesFound ?? prev);

          if (job.status === "completed") {
            clearInterval(pollInterval);
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            setIsSyncing(false);
            setSyncStatus(null);
            setLastSyncedAt(new Date());
            setIndexedDocuments(() => job.filesProcessed ?? job.filesFound ?? 0);
            toast.success(t("notifications.syncCompleted"));
          } else if (job.status === "failed") {
            clearInterval(pollInterval);
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            setIsSyncing(false);
            setSyncStatus(null);
            toast.error(t("notifications.syncError"));
          }
        } catch (error) {
          console.error("Error checking sync status:", error);
          clearInterval(pollInterval);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          setIsSyncing(false);
          setSyncStatus(null);
          toast.error("Error checking sync status");
        }
      }, 3000);

      timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        setIsSyncing(false);
        setSyncStatus(null);
        toast.warning("Sync is taking longer than expected. Check status later.");
      }, 600000);
    } catch (error) {
      console.error("Error syncing drive:", error);
      toast.error("Failed to start drive sync");
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  const syncPhaseCopy = (() => {
    if (isSyncing && syncStatus) {
      if (syncStatus.status === "scanning") return t("status.sync.scanning");
      if (syncStatus.status === "downloading") return t("status.sync.downloading");
      if (syncStatus.status === "uploading") return t("status.sync.uploading");
      if (syncStatus.status === "indexing") return t("status.sync.indexing");
    }

    if (lastSyncedAt) {
      return t("status.sync.ready");
    }

    return t("status.sync.idle");
  })();

  const syncHelperCopy = (() => {
    if (isSyncing && syncStatus) {
      const processed = syncStatus.filesProcessed ?? 0;
      const total = syncStatus.filesFound ?? syncStatus.filesProcessed ?? 0;
      return `${Math.round(syncStatus.progress)}% 진행 / ${processed}/${total} files processed`;
    }

    if (lastSyncedAt) {
      const formatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastSyncedAt);
      return `마지막 동기화 ${formatted} / Last sync ${formatted}`;
    }

    return "드라이브를 연결해 에이전트 컨텍스트를 채워주세요 / Connect Drive to hydrate context.";
  })();

  const documentsCopy =
    indexedDocuments ??
    syncStatus?.filesProcessed ??
    syncStatus?.filesFound ??
    null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 pb-16 pt-20 sm:gap-6 sm:px-4 md:px-0 md:pt-28">
      <section 
        className="rounded-2xl border border-white/40 bg-gradient-to-br from-sky-50/90 via-white to-purple-50/80 p-4 shadow-xl shadow-blue-200/50 backdrop-blur-2xl dark:border-white/10 dark:from-sky-950/60 dark:via-zinc-900/90 dark:to-purple-950/50 dark:shadow-none sm:p-6 sm:rounded-3xl"
        role="region"
        aria-label="Lead Search Agent Overview"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-blue-500 sm:text-xs sm:tracking-[0.45em]">
            Lead Search Agent / 리드 서치 에이전트
          </div>
          <h1 className="text-xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-2xl md:text-3xl">
            문서 기반 리드 탐색, 영어와 한국어 모두 즉시 지원합니다.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-200 sm:text-base">
            Google Drive에 있는 제안서, 콜 노트, 리포트를 그대로 불러와 리드, 연락처, 인사이트를 한국어와
            영어로 요청하세요. The agent cites documents, confidence, and next steps for every reply.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              onClick={handleSyncDrive}
              className={cn(
                "rounded-full px-5 py-3 text-sm font-medium transition-all sm:px-4 sm:py-2",
                isSyncing
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0",
              )}
              disabled={isSyncing}
              aria-label={isSyncing ? "Sync in progress" : "Sync Google Drive"}
            >
              {isSyncing ? "드라이브 동기화 중 / Sync in progress" : "구글 드라이브 동기화 / Sync Google Drive"}
            </button>
            <button
              onClick={() => handleQuickPrompt(quickPrompts[0].value)}
              className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 active:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:active:bg-zinc-800 sm:px-4 sm:py-2"
              aria-label="Review latest leads"
            >
              최근 리드 하이라이트 보기 / Review latest leads
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-xl border border-white/60 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70 sm:p-4 sm:rounded-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-500 sm:text-[11px] sm:tracking-[0.35em]">
              Sync status / 동기화 상태
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
              {syncPhaseCopy}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-300">{syncHelperCopy}</p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70 sm:p-4 sm:rounded-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-500 sm:text-[11px] sm:tracking-[0.35em]">
              Documents indexed / 문서 인덱싱
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
              {documentsCopy !== null ? documentsCopy : "--"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-300">
              Gemini File Search context ready.
            </p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70 sm:p-4 sm:rounded-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-500 sm:text-[11px] sm:tracking-[0.35em]">
              Agent status / 에이전트 상태
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
              {isGeneratingResponse ? "응답 생성 중 / Responding" : "대기 중 / Ready"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-300">
              {isGeneratingResponse
                ? "리드 인텔리전스를 스트리밍하고 있습니다."
                : "다음 리드, 페르소나, 영업 지역 질문을 기다리는 중입니다."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/40 bg-white/85 p-4 shadow-lg shadow-purple-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-none">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
          Quick prompts / 바로 실행
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleQuickPrompt(prompt.value)}
              className="rounded-full border border-zinc-200/80 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/40 bg-white/90 shadow-xl shadow-purple-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/85 dark:shadow-none">
        <div className="border-b border-white/40 px-6 py-5 dark:border-white/10">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
            Conversation / 대화
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            문서를 언급하거나 리드 조건을 한국어·영어로 설명하면, 에이전트가 바로 분석하고 답변해 드립니다.
          </p>
        </div>

        <div
          className={cn("px-4 py-6 md:px-6", {
            "flex flex-col items-center justify-center gap-4 text-center": !hasMessages,
          })}
        >
          {hasMessages ? (
            <Messages messages={messages} status={status} />
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                “헬스케어 신규 리드 찾아줘” 같이 한국어로 말해도 되고, 영어로 묻거나 섞어서 물어도 괜찮아요.
              </h2>
              <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                Ask for territories, personas, contacts, or follow-ups. The agent keeps context from your Drive sync,
                cites documents, and prepares ready-to-export leads.
              </p>
            </>
          )}
        </div>

        <div className="border-t border-white/40 px-4 py-4 dark:border-white/10 md:px-6">
          <Input
            input={input}
            setInput={setInput}
            isGeneratingResponse={isGeneratingResponse}
            onSubmit={handleSubmit}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-300">
            <span>Enter로 전송, Shift+Enter로 줄바꿈 · Press Enter to send, Shift+Enter for newline.</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncDrive}
                disabled={isSyncing}
                className={cn(
                  "rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-medium transition-colors dark:border-zinc-700",
                  {
                    "cursor-not-allowed opacity-60": isSyncing,
                    "hover:border-zinc-400 dark:hover:border-zinc-500": !isSyncing,
                  },
                )}
              >
                {isSyncing ? "Drive 새로고침 중" : "Drive 데이터 새로고침"}
              </button>
              <button
                onClick={() => {
                  if (isGeneratingResponse) {
                    stop();
                    return;
                  }
                  handleSubmit();
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all",
                  isGeneratingResponse || input.trim() === ""
                    ? "bg-zinc-400 text-zinc-100 dark:bg-zinc-700"
                    : "bg-zinc-900 hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900",
                )}
              >
                {isGeneratingResponse ? (
                  <>
                    <StopIcon size={12} />
                    응답 중지 / Stop response
                  </>
                ) : (
                  <>
                    <ArrowUpIcon size={12} />
                    리드 요청 실행 / Run lead request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="px-2">
        <Footnote />
      </div>
    </div>
  );
}
