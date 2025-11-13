'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { FavoritesStore, generateLeadId } from '@/lib/favorites-store';
import { toast } from 'sonner';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function LeadDetailModal({ isOpen, onClose, lead }: LeadDetailModalProps) {
  const { t, locale } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(
    lead ? FavoritesStore.isFavorite(generateLeadId(lead)) : false
  );
  const [notes, setNotes] = useState('');

  if (!lead) return null;

  const leadId = generateLeadId(lead);
  const confidencePercent = Math.round(lead.confidence * 100);
  const confidenceColor =
    lead.confidence >= 0.8
      ? 'text-green-600 dark:text-green-400'
      : lead.confidence >= 0.5
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  const handleToggleFavorite = () => {
    const newState = FavoritesStore.toggleFavorite(leadId);
    setIsFavorite(newState);
    toast.success(
      newState
        ? locale === 'ko'
          ? '즐겨찾기에 추가되었어요'
          : 'Added to favorites'
        : locale === 'ko'
        ? '즐겨찾기에서 제거되었어요'
        : 'Removed from favorites'
    );
  };

  const handleCopyField = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(
      locale === 'ko'
        ? `${field}이(가) 복사되었어요`
        : `${field} copied to clipboard`
    );
  };

  const handleExportLead = () => {
    const leadData = JSON.stringify(lead, null, 2);
    const blob = new Blob([leadData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${lead.company.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(locale === 'ko' ? '리드가 내보내졌어요' : 'Lead exported successfully');
  };

  const handleShareLead = async () => {
    const shareText = `${lead.company.name}\n${lead.company.description || ''}\n${lead.company.website || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: lead.company.name,
          text: shareText,
        });
        toast.success(locale === 'ko' ? '공유되었어요' : 'Shared successfully');
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(shareText);
      toast.success(locale === 'ko' ? '클립보드에 복사되었어요' : 'Copied to clipboard');
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-hidden"
          >
            <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {lead.company.name}
                    </h2>
                    <button
                      onClick={handleToggleFavorite}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          isFavorite
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-zinc-400 hover:text-yellow-500'
                        }`}
                        fill={isFavorite ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {lead.company.industry && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {lead.company.industry}
                      </span>
                    )}
                    {lead.company.location && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {lead.company.location}
                      </span>
                    )}
                    <span className={`text-sm font-semibold ${confidenceColor} flex items-center gap-1`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {confidencePercent}% {locale === 'ko' ? '신뢰도' : 'confidence'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Quick Actions */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {lead.company.website && (
                    <a
                      href={lead.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      {locale === 'ko' ? '웹사이트 방문' : 'Visit Website'}
                    </a>
                  )}
                  <button
                    onClick={handleExportLead}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {locale === 'ko' ? '내보내기' : 'Export'}
                  </button>
                  <button
                    onClick={handleShareLead}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {locale === 'ko' ? '공유' : 'Share'}
                  </button>
                </div>

                {/* Company Description */}
                {lead.company.description && (
                  <div className="mb-6 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      {locale === 'ko' ? '회사 설명' : 'Company Description'}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {lead.company.description}
                    </p>
                  </div>
                )}

                {/* Company Details Grid */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.company.size && (
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {locale === 'ko' ? '회사 규모' : 'Company Size'}
                      </div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        {lead.company.size}
                      </div>
                    </div>
                  )}
                  {lead.company.website && (
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {locale === 'ko' ? '웹사이트' : 'Website'}
                      </div>
                      <button
                        onClick={() => handleCopyField(locale === 'ko' ? '웹사이트' : 'Website', lead.company.website!)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {lead.company.website}
                      </button>
                    </div>
                  )}
                </div>

                {/* Contacts Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {locale === 'ko' ? '담당자' : 'Contacts'} ({lead.contacts.length})
                  </h3>
                  <div className="space-y-3">
                    {lead.contacts.map((contact, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-white">
                              {contact.name}
                            </div>
                            {contact.title && (
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                {contact.title}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {contact.email}
                              </a>
                              <button
                                onClick={() => handleCopyField('Email', contact.email!)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {contact.phone}
                              </a>
                              <button
                                onClick={() => handleCopyField('Phone', contact.phone!)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {contact.linkedin && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              <a
                                href={contact.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                LinkedIn
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Source & Metadata */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    {locale === 'ko' ? '메타데이터' : 'Metadata'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {locale === 'ko' ? '출처' : 'Source'}
                      </span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {lead.source}
                      </span>
                    </div>
                    {lead.metadata?.documentType && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {locale === 'ko' ? '문서 유형' : 'Document Type'}
                        </span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {lead.metadata.documentType}
                        </span>
                      </div>
                    )}
                    {lead.metadata?.keywords && lead.metadata.keywords.length > 0 && (
                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 block">
                          {locale === 'ko' ? '키워드' : 'Keywords'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {lead.metadata.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    {locale === 'ko' ? '메모' : 'Notes'}
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={locale === 'ko' ? '메모를 입력하세요...' : 'Add your notes...'}
                    className="w-full p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
