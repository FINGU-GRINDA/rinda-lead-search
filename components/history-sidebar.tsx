'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryManager, SearchHistory } from '@/lib/history-manager';
import { useTranslation } from '@/lib/use-translation';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { TooltipWrapper } from './tooltip-wrapper';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (history: SearchHistory) => void;
}

export function HistorySidebar({ isOpen, onClose, onSelectHistory }: HistorySidebarProps) {
  const { t, locale } = useTranslation();
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = () => {
    const allHistory = HistoryManager.getHistory();
    setHistory(allHistory);
  };

  const filteredHistory = searchQuery
    ? history.filter(item =>
        item.query.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HistoryManager.deleteSearch(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm(locale === 'ko' ? '모든 검색 기록을 삭제하시겠어요?' : 'Clear all search history?')) {
      HistoryManager.clearHistory();
      loadHistory();
    }
  };

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: locale === 'ko' ? ko : enUS,
      });
    } catch {
      return date.toLocaleDateString();
    }
  };

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
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {locale === 'ko' ? '검색 기록' : 'Search History'}
              </h2>
              <div className="flex items-center gap-2">
                <TooltipWrapper content={locale === 'ko' ? '전체 삭제' : 'Clear all'}>
                  <button
                    onClick={handleClearAll}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </TooltipWrapper>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'ko' ? '기록 검색...' : 'Search history...'}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <svg
                    className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {locale === 'ko' ? '검색 기록이 없어요' : 'No search history'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        onSelectHistory(item);
                        onClose();
                      }}
                      className="w-full text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {item.query}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatTime(item.timestamp)}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {item.leadCount} {locale === 'ko' ? '개 리드' : 'leads'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
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
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
