'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { HistoryManager } from '@/lib/history-manager';

interface SearchSuggestionsProps {
  isVisible: boolean;
  searchQuery: string;
  onSelectSuggestion: (suggestion: string) => void;
  onClose: () => void;
}

export function SearchSuggestions({
  isVisible,
  searchQuery,
  onSelectSuggestion,
  onClose,
}: SearchSuggestionsProps) {
  const { t, locale } = useTranslation();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from history
    const history = HistoryManager.getHistory();
    const uniqueQueries = Array.from(new Set(history.map((h) => h.query)))
      .slice(0, 5);
    setRecentSearches(uniqueQueries);
  }, []);

  const popularSuggestions = locale === 'ko'
    ? [
        'IT 업종 리드 찾아줘',
        '헬스케어 스타트업',
        '제조업 대기업',
        '소프트웨어 개발사',
        '마케팅 에이전시',
        '최근 제안서에서 연락처 추출',
        'AI 관련 기업',
        '핀테크 스타트업',
      ]
    : [
        'Find IT industry leads',
        'Healthcare startups',
        'Manufacturing companies',
        'Software development firms',
        'Marketing agencies',
        'Extract contacts from proposals',
        'AI companies',
        'Fintech startups',
      ];

  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery.trim()
    ? popularSuggestions.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularSuggestions;

  const handleClearRecent = () => {
    HistoryManager.clearHistory();
    setRecentSearches([]);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-96 overflow-y-auto"
      >
        {/* Recent Searches */}
        {!searchQuery.trim() && recentSearches.length > 0 && (
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-3 py-2">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                {locale === 'ko' ? '최근 검색' : 'Recent Searches'}
              </h4>
              <button
                onClick={handleClearRecent}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === 'ko' ? '전체 삭제' : 'Clear all'}
              </button>
            </div>
            {recentSearches.map((search, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  onSelectSuggestion(search);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
              >
                <svg
                  className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0"
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
                <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                  {search}
                </span>
                <svg
                  className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            ))}
          </div>
        )}

        {/* Popular Suggestions */}
        <div className="p-2">
          <div className="px-3 py-2">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {locale === 'ko' ? '추천 검색어' : 'Suggested Searches'}
            </h4>
          </div>
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  onSelectSuggestion(suggestion);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
              >
                <svg
                  className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                  {suggestion}
                </span>
                <svg
                  className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            ))
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {locale === 'ko'
                  ? '일치하는 검색어가 없어요'
                  : 'No matching suggestions'}
              </p>
            </div>
          )}
        </div>

        {/* Keyboard Hint */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 font-mono text-xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 font-mono text-xs">
                ↓
              </kbd>
              {locale === 'ko' ? '이동' : 'navigate'}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 font-mono text-xs">
                Enter
              </kbd>
              {locale === 'ko' ? '선택' : 'select'}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 font-mono text-xs">
                Esc
              </kbd>
              {locale === 'ko' ? '닫기' : 'close'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
