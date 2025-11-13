'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useArtifact } from '@/lib/contexts/artifact-context';
import { useTranslation } from '@/lib/use-translation';
import { LeadSheet } from './lead-sheet';

export function ArtifactPanel() {
  const { artifactType, artifactData, isArtifactVisible, clearArtifact } = useArtifact();
  const { locale } = useTranslation();

  if (!isArtifactVisible || !artifactData) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
        <div className="text-center px-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="w-8 h-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {locale === 'ko' ? '검색 결과가 여기에 표시됩니다' : 'Results will appear here'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            {locale === 'ko'
              ? '리드를 검색하거나 데이터를 분석하면 이 패널에 결과가 표시됩니다.'
              : 'Search for leads or analyze data to see results in this panel.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={artifactType}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800"
      >
        {artifactType === 'leads' && <LeadSheet leads={artifactData} />}
      </motion.div>
    </AnimatePresence>
  );
}
