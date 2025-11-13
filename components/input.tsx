"use client";

import { toast } from "sonner";
import { useTranslation } from "@/lib/use-translation";

interface InputProps {
  input: string;
  setInput: (value: string) => void;
  isGeneratingResponse: boolean;
  onSubmit: () => void;
}

export function Input({
  input,
  setInput,
  isGeneratingResponse,
  onSubmit,
}: InputProps) {
  const { t } = useTranslation();

  return (
    <textarea
      className="w-full resize-none rounded-2xl bg-transparent text-base leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-white"
      placeholder={t("chat.placeholder")}
      value={input}
      autoFocus
      onChange={(event) => {
        setInput(event.currentTarget.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();

          if (input === "") {
            return;
          }

          if (isGeneratingResponse) {
            toast.error(t("chat.agentThinking"));
            return;
          }

          onSubmit();
        }
      }}
    />
  );
}
