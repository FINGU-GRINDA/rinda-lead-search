'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { TooltipWrapper } from './tooltip-wrapper';

interface LeadListPanelProps {
  leads: Lead[];
  selectedLeadIndex: number | null;
  onLeadSelect: (index: number) => void;
  selectedLeads: Set<number>;
  onToggleSelect: (index: number) => void;
}

export function LeadListPanel({
  leads,
  selectedLeadIndex,
  onLeadSelect,
  selectedLeads,
  onToggleSelect,
}: LeadListPanelProps) {
  const { t } = useTranslation();

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return {
        label: t('leadCard.highConfidence'),
        color: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-300',
      };
    } else if (confidence >= 0.6) {
      return {
        label: t('leadCard.mediumConfidence'),
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700 dark:text-yellow-300',
      };
    } else {
      return {
        label: t('leadCard.lowConfidence'),
        color: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-300',
      };
    }
  };

  if (leads.length === 0) {
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          {t('leads.noResults')}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('leads.noResultsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-2">
        {leads.map((lead, index) => {
          const badge = getConfidenceBadge(lead.confidence);
          const isSelected = selectedLeadIndex === index;
          const isChecked = selectedLeads.has(index);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onLeadSelect(index)}
              className={`relative p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md'
                  : 'bg-white/80 dark:bg-zinc-800/80 border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <div
                className="absolute top-3 right-3 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(index);
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Company Name */}
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 pr-6">
                {lead.company.name}
              </h3>

              {/* Industry & Location */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {lead.company.industry && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {lead.company.industry}
                  </span>
                )}
                {lead.company.location && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {lead.company.location}
                  </span>
                )}
              </div>

              {/* Contacts & Confidence */}
              <div className="flex items-center justify-between">
                <TooltipWrapper content={t('leadDetail.contacts')}>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {t('leadCard.contacts', { count: lead.contacts.length })}
                  </span>
                </TooltipWrapper>

                <TooltipWrapper content={t('leadCard.confidenceTooltip')}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${badge.color}`}></div>
                    <span className={`text-[10px] font-medium ${badge.textColor}`}>
                      {Math.round(lead.confidence * 100)}%
                    </span>
                  </div>
                </TooltipWrapper>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
