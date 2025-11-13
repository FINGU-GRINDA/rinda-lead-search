import { Toaster } from 'sonner';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LanguageProvider } from '@/lib/contexts/language-context';

import './globals.css';

export const metadata: Metadata = {
  title: 'RINDA Search - AI 리드 발굴 에이전트',
  description:
    'AI 기반 리드 발굴 및 고객사 정보 검색 서비스. 구글 드라이브 문서에서 자동으로 리드를 발굴합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <LanguageProvider>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
          >
            Skip to main content
          </a>
          <header
            className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            role="banner"
          >
            <nav
              className="mx-auto flex items-center justify-between px-6 py-3"
              aria-label="Main navigation"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-base font-semibold text-zinc-900 dark:text-white">
                  RINDA Search
                </span>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
              </div>
            </nav>
          </header>
          <main
            id="main-content"
            className="pt-[52px] h-screen"
            role="main"
            tabIndex={-1}
          >
            {children}
          </main>
          <Toaster 
            position="top-center" 
            richColors
            closeButton
            toastOptions={{
              classNames: {
                error: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-900 dark:text-error-200',
                success: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-900 dark:text-success-200',
                warning: 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-900 dark:text-warning-200',
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
