'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { TooltipWrapper } from './tooltip-wrapper';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { LeadDetailModal } from './lead-detail-modal';
import { FavoritesStore, generateLeadId } from '@/lib/favorites-store';

interface LeadTableArtifactProps {
  leads: Lead[];
}

export function LeadTableArtifact({ leads }: LeadTableArtifactProps) {
  const { t, locale } = useTranslation();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'contacts'>('confidence');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleToggleFavorite = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const leadId = generateLeadId(lead);
    const isNowFavorite = FavoritesStore.toggleFavorite(leadId);
    toast.success(
      isNowFavorite
        ? locale === 'ko'
          ? '즐겨찾기에 추가되었어요'
          : 'Added to favorites'
        : locale === 'ko'
        ? '즐겨찾기에서 제거되었어요'
        : 'Removed from favorites'
    );
  };

  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        lead.company.name.toLowerCase().includes(searchLower) ||
        lead.company.industry?.toLowerCase().includes(searchLower) ||
        lead.contacts.some((c) => c.name.toLowerCase().includes(searchLower))
      );
    });

    result.sort((a, b) => {
      let compare = 0;
      switch (sortBy) {
        case 'name':
          compare = a.company.name.localeCompare(b.company.name);
          break;
        case 'confidence':
          compare = a.confidence - b.confidence;
          break;
        case 'contacts':
          compare = a.contacts.length - b.contacts.length;
          break;
      }
      return sortDesc ? -compare : compare;
    });

    return result;
  }, [leads, debouncedSearchQuery, sortBy, sortDesc]);

  const toggleSort = (column: 'name' | 'confidence' | 'contacts') => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const toggleRow = (index: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredLeads.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredLeads.map((_, i) => i)));
    }
  };

  const exportSelected = async (format: 'csv' | 'json') => {
    const selectedLeads = Array.from(selectedRows).map((i) => filteredLeads[i]);
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : filteredLeads;

    if (format === 'csv') {
      const csv = generateCSV(dataToExport);
      downloadFile(csv, 'leads.csv', 'text/csv');
    } else {
      const json = JSON.stringify(dataToExport, null, 2);
      downloadFile(json, 'leads.json', 'application/json');
    }
    toast.success(t('notifications.exportSuccess'));
  };

  const generateCSV = (data: Lead[]) => {
    const headers = ['회사명', '산업군', '위치', '담당자명', '직급', '이메일', '전화', 'LinkedIn', '신뢰도'];
    const rows = data.flatMap((lead) =>
      lead.contacts.map((contact) => [
        lead.company.name,
        lead.company.industry || '',
        lead.company.location || '',
        contact.name,
        contact.title || '',
        contact.email || '',
        contact.phone || '',
        contact.linkedin || '',
        Math.round(lead.confidence * 100) + '%',
      ])
    );
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('notifications.copySuccess'));
    } catch {
      toast.error(t('notifications.copyError'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t('leads.title')} ({filteredLeads.length})
          </h3>
          {selectedRows.size > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('actions.selected', { count: selectedRows.size })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('leads.search')}
            className="h-8 w-48 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Export Buttons */}
          <TooltipWrapper content={t('actions.exportTooltip')}>
            <button
              onClick={() => exportSelected('csv')}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              CSV
            </button>
          </TooltipWrapper>
          <TooltipWrapper content={t('actions.exportTooltip')}>
            <button
              onClick={() => exportSelected('json')}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              JSON
            </button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
        {filteredLeads.map((lead, index) => {
          const leadId = generateLeadId(lead);
          const isFavorite = FavoritesStore.isFavorite(leadId);
          const confidencePercent = Math.round(lead.confidence * 100);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleViewLead(lead)}
              className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800 cursor-pointer"
            >
              {/* Header with Company Name and Favorite */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-zinc-900 dark:text-white mb-1 truncate">
                    {lead.company.name}
                  </h4>
                  {lead.company.industry && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {lead.company.industry}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {/* Confidence Badge */}
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      lead.confidence >= 0.8
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : lead.confidence >= 0.6
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {confidencePercent}%
                  </div>
                  {/* Favorite Button - 44x44px touch target */}
                  <button
                    onClick={(e) => handleToggleFavorite(lead, e)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        isFavorite
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-zinc-400'
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
              </div>

              {/* Location */}
              {lead.company.location && (
                <div className="flex items-center gap-1.5 mb-3">
                  <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {lead.company.location}
                  </span>
                </div>
              )}

              {/* Contacts Preview */}
              <div className="mb-3">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {locale === 'ko' ? '담당자' : 'Contacts'} ({lead.contacts.length})
                </div>
                <div className="space-y-1.5">
                  {lead.contacts.slice(0, 2).map((contact, ci) => (
                    <div key={ci} className="text-sm">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {contact.name}
                        {contact.title && (
                          <span className="text-zinc-500 dark:text-zinc-400 font-normal ml-1">
                            · {contact.title}
                          </span>
                        )}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {contact.email}
                        </div>
                      )}
                    </div>
                  ))}
                  {lead.contacts.length > 2 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      +{lead.contacts.length - 2} {locale === 'ko' ? '더 보기' : 'more'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleViewLead(lead)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {locale === 'ko' ? '자세히 보기' : 'View Details'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleAll}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  {t('leadDetail.companyInfo')}
                  {sortBy === 'name' && <span>{sortDesc ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t('leadDetail.industry')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t('leadDetail.location')}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => toggleSort('contacts')}
              >
                <div className="flex items-center gap-1">
                  {t('leadDetail.contacts')}
                  {sortBy === 'contacts' && <span>{sortDesc ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => toggleSort('confidence')}
              >
                <div className="flex items-center gap-1">
                  {t('leadCard.confidence')}
                  {sortBy === 'confidence' && <span>{sortDesc ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLeads.map((lead, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRow(index)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {lead.company.name}
                    </div>
                    {lead.company.website && (
                      <a
                        href={lead.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {lead.company.website}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {lead.company.industry || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {lead.company.location || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {lead.contacts.slice(0, 2).map((contact, ci) => (
                      <div key={ci} className="text-sm">
                        <div className="font-medium text-zinc-900 dark:text-white">{contact.name}</div>
                        {contact.email && (
                          <button
                            onClick={() => copyToClipboard(contact.email!)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {contact.email}
                          </button>
                        )}
                      </div>
                    ))}
                    {lead.contacts.length > 2 && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        +{lead.contacts.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      lead.confidence >= 0.8
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : lead.confidence >= 0.6
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {Math.round(lead.confidence * 100)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleViewLead(lead)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLeads.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('leads.noResults')}</p>
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
      />
    </motion.div>
  );
}
