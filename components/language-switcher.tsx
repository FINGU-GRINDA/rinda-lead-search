'use client';

import { useLanguage } from '@/lib/contexts/language-context';
import { Locale } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { TooltipWrapper } from './tooltip-wrapper';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    const newLocale: Locale = locale === 'ko' ? 'en' : 'ko';
    setLocale(newLocale);
  };

  return (
    <TooltipWrapper content={locale === 'ko' ? '언어 전환' : 'Switch Language'}>
      <button
        onClick={toggleLanguage}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-200"
      >
        <motion.div
          className="flex items-center gap-2"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {locale === 'ko' ? '한국어' : 'English'}
          </span>
          <svg
            className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
        </motion.div>
      </button>
    </TooltipWrapper>
  );
}
