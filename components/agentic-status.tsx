'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useArtifact } from '@/lib/contexts/artifact-context';
import { useTranslation } from '@/lib/use-translation';

export function AgenticStatus() {
  const { agenticSteps, currentStep } = useArtifact();
  const { locale } = useTranslation();

  if (agenticSteps.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {locale === 'ko' ? 'AI 에이전트 작업 중' : 'AI Agent Working'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {locale === 'ko' ? '진행 상황을 확인하세요' : 'Track progress below'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {agenticSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                step.id === currentStep
                  ? 'bg-blue-50 dark:bg-blue-950/20'
                  : step.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-950/20'
                  : step.status === 'error'
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/50'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'error'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-zinc-900 dark:text-white'
                }`}>
                  {step.message}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {step.timestamp.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
