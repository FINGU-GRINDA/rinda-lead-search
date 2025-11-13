'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { GLOBAL_SHORTCUTS, getShortcutLabel } from '@/lib/keyboard-shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const { t, locale } = useTranslation();

  const shortcuts = [
    { ...GLOBAL_SHORTCUTS.SEARCH, label: locale === 'ko' ? '검색 입력란으로 이동' : 'Focus search input' },
    { ...GLOBAL_SHORTCUTS.NEW_SEARCH, label: locale === 'ko' ? '새 검색' : 'New search' },
    { ...GLOBAL_SHORTCUTS.TOGGLE_HISTORY, label: locale === 'ko' ? '검색 기록 열기/닫기' : 'Toggle search history' },
    { ...GLOBAL_SHORTCUTS.ANALYZE_WEBSITE, label: locale === 'ko' ? '웹사이트 분석' : 'Analyze website' },
    { ...GLOBAL_SHORTCUTS.EXPORT, label: locale === 'ko' ? '리드 내보내기' : 'Export leads' },
    { ...GLOBAL_SHORTCUTS.TOGGLE_LANGUAGE, label: locale === 'ko' ? '언어 전환' : 'Toggle language' },
    { ...GLOBAL_SHORTCUTS.ESCAPE, label: locale === 'ko' ? '모달 닫기/입력 지우기' : 'Close modal/Clear input' },
    { ...GLOBAL_SHORTCUTS.HELP, label: locale === 'ko' ? '단축키 도움말' : 'Show this help' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {locale === 'ko' ? '키보드 단축키' : 'Keyboard Shortcuts'}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {locale === 'ko' ? '빠르게 작업할 수 있는 단축키들' : 'Work faster with keyboard shortcuts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {shortcut.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {getShortcutLabel(shortcut).split(' + ').map((key, i, arr) => (
                          <span key={i} className="flex items-center">
                            <kbd className="px-2 py-1 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded shadow-sm">
                              {key}
                            </kbd>
                            {i < arr.length - 1 && (
                              <span className="mx-1 text-zinc-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tip */}
                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                  <div className="flex gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-medium mb-1">
                        {locale === 'ko' ? '💡 팁' : '💡 Pro Tip'}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        {locale === 'ko'
                          ? '단축키를 사용하면 작업 속도가 2배 빨라집니다. 자주 사용하는 기능의 단축키를 기억해보세요!'
                          : 'Using shortcuts can double your productivity. Try to remember shortcuts for your most-used actions!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
