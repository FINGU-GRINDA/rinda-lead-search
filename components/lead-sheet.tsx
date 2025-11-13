'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { toast } from 'sonner';
import { LeadDetailModal } from './lead-detail-modal';
import { generateLeadId, FavoritesStore } from '@/lib/favorites-store';

interface LeadSheetProps {
  leads: Lead[];
}

export function LeadSheet({ leads }: LeadSheetProps) {
  const { t, locale } = useTranslation();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'contacts'>('confidence');
  const [sortDesc, setSortDesc] = useState(true);

  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      const searchLower = searchQuery.toLowerCase();
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
  }, [leads, searchQuery, sortBy, sortDesc]);

  const toggleSort = (column: 'name' | 'confidence' | 'contacts') => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const exportCSV = () => {
    const headers = ['Company', 'Industry', 'Location', 'Contact', 'Title', 'Email', 'Phone', 'LinkedIn', 'Confidence'];
    const rows = filteredLeads.flatMap((lead) =>
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
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(locale === 'ko' ? '내보내기 완료!' : 'Export successful!');
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ko' ? '검색...' : 'Search...'}
              className="h-9 w-64 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {filteredLeads.length} {locale === 'ko' ? '개' : 'items'}
            </span>
          </div>
          <button
            onClick={exportCSV}
            className="flex h-9 items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th
                  onClick={() => toggleSort('name')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {locale === 'ko' ? '회사명' : 'Company'}
                    {sortBy === 'name' && (
                      <span className="text-blue-600">{sortDesc ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {locale === 'ko' ? '산업' : 'Industry'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {locale === 'ko' ? '위치' : 'Location'}
                </th>
                <th
                  onClick={() => toggleSort('contacts')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {locale === 'ko' ? '담당자' : 'Contacts'}
                    {sortBy === 'contacts' && (
                      <span className="text-blue-600">{sortDesc ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('confidence')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {locale === 'ko' ? '신뢰도' : 'Confidence'}
                    {sortBy === 'confidence' && (
                      <span className="text-blue-600">{sortDesc ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {locale === 'ko' ? '액션' : 'Actions'}
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
                  onClick={() => handleViewLead(lead)}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {lead.company.name}
                      </div>
                      {lead.company.website && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs">
                          {lead.company.website}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {lead.company.industry || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {lead.company.location || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {lead.contacts.slice(0, 2).map((contact, ci) => (
                        <div key={ci} className="text-sm">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {contact.name}
                          </div>
                          {contact.email && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {contact.email}
                            </div>
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
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLead(lead);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {locale === 'ko' ? '보기' : 'View'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {locale === 'ko' ? '검색 결과가 없습니다' : 'No results found'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
      />
    </>
  );
}
