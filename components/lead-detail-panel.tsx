'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { TooltipWrapper } from './tooltip-wrapper';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LeadDetailPanelProps {
  lead: Lead | null;
}

export function LeadDetailPanel({ lead }: LeadDetailPanelProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('notifications.copySuccess'));
    } catch (error) {
      toast.error(t('notifications.copyError'));
    }
  };

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('leadCard.viewDetails')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-y-auto p-6"
    >
      {/* Company Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {lead.company.name}
        </h2>
        {lead.company.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {lead.company.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {lead.company.website && (
            <TooltipWrapper content={t('leadDetail.websiteTooltip')}>
              <a
                href={lead.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                <span>{t('leadDetail.website')}</span>
              </a>
            </TooltipWrapper>
          )}

          {lead.company.industry && (
            <div className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                {t('leadDetail.industry')}
              </div>
              <div className="font-medium text-zinc-900 dark:text-white">
                {lead.company.industry}
              </div>
            </div>
          )}

          {lead.company.location && (
            <div className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                {t('leadDetail.location')}
              </div>
              <div className="font-medium text-zinc-900 dark:text-white">
                {lead.company.location}
              </div>
            </div>
          )}

          {lead.company.size && (
            <div className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                {t('leadDetail.size')}
              </div>
              <div className="font-medium text-zinc-900 dark:text-white">
                {lead.company.size}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contacts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          {t('leadDetail.contacts')}
        </h3>
        <div className="space-y-3">
          {lead.contacts.map((contact, index) => (
            <div
              key={index}
              className="p-4 bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white">
                    {contact.name}
                  </h4>
                  {contact.title && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {contact.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {contact.email && (
                  <TooltipWrapper content={t('leadDetail.clickToCopy')}>
                    <button
                      onClick={() => copyToClipboard(contact.email!, t('leadDetail.email'))}
                      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span className="truncate">{contact.email}</span>
                    </button>
                  </TooltipWrapper>
                )}

                {contact.phone && (
                  <TooltipWrapper content={t('leadDetail.clickToCopy')}>
                    <button
                      onClick={() => copyToClipboard(contact.phone!, t('leadDetail.phone'))}
                      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span>{contact.phone}</span>
                    </button>
                  </TooltipWrapper>
                )}

                {contact.linkedin && (
                  <TooltipWrapper content={t('leadDetail.clickToCopy')}>
                    <button
                      onClick={() => copyToClipboard(contact.linkedin!, 'LinkedIn')}
                      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="truncate">{contact.linkedin}</span>
                    </button>
                  </TooltipWrapper>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-6">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-white/30 dark:border-white/10 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{t('leadDetail.source')}:</span>
            <TooltipWrapper content={t('leadDetail.sourceTooltip')}>
              <span className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">
                {lead.source}
              </span>
            </TooltipWrapper>
          </div>
          {lead.extractedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">{t('leadDetail.extractedAt')}:</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                {format(new Date(lead.extractedAt), 'yyyy-MM-dd HH:mm')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{t('leadCard.confidence')}:</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              {Math.round(lead.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          {t('leadDetail.addNote')}
        </h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('leadDetail.notePlaceholder')}
          className="w-full px-4 py-3 text-sm bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
        />
        <button
          onClick={() => {
            toast.success(t('notifications.noteSaved'));
            setNote('');
          }}
          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          {t('leadDetail.saveNote')}
        </button>
      </div>
    </motion.div>
  );
}
