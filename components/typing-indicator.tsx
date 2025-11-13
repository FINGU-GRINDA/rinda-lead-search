'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';

export function TypingIndicator() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1">
        <div className="typing-dot h-2 w-2 rounded-full bg-blue-500"></div>
        <div className="typing-dot h-2 w-2 rounded-full bg-purple-500"></div>
        <div className="typing-dot h-2 w-2 rounded-full bg-pink-500"></div>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {t('chat.agentThinking')}
      </span>
    </motion.div>
  );
}
