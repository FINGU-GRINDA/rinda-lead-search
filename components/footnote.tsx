import Link from 'next/link';

export function Footnote() {
  return (
    <div className="hidden text-xs leading-5 text-zinc-500 dark:text-zinc-400 sm:block">
      Lead Search Agent Service는{" "}
      <Link
        className="underline underline-offset-2"
        href="https://nextjs.org/"
        target="_blank"
      >
        Next.js
      </Link>{" "}
      와 Gemini File Search 컨텍스트,{" "}
      <Link
        className="underline underline-offset-2"
        href="https://sdk.vercel.ai/"
        target="_blank"
      >
        Vercel AI SDK
      </Link>
      로 구동됩니다. Keep syncing Drive so every request returns sourced, export-ready lead intelligence in both Korean and English.
    </div>
  );
}
