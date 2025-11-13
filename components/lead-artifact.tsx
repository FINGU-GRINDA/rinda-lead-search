'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/use-translation';
import { Lead } from '@/lib/schemas/lead';
import { FilterToolbar } from './filter-toolbar';
import { LeadListPanel } from './lead-list-panel';
import { LeadDetailPanel } from './lead-detail-panel';
import { TooltipWrapper } from './tooltip-wrapper';
import { ExportButton } from './export-button';
import { format } from 'date-fns';

interface LeadArtifactProps {
  leads: Lead[];
}

export function LeadArtifact({ leads }: LeadArtifactProps) {
  const { t } = useTranslation();

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'date'>('confidence');

  // Selection State
  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // Extract unique industries and locations
  const industries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => {
      if (lead.company.industry) set.add(lead.company.industry);
    });
    return Array.from(set).sort();
  }, [leads]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => {
      if (lead.company.location) set.add(lead.company.location);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filter and Sort Leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        lead.company.name.toLowerCase().includes(searchLower) ||
        lead.contacts.some((c) => c.name.toLowerCase().includes(searchLower));

      // Industry filter
      const matchesIndustry = !selectedIndustry || lead.company.industry === selectedIndustry;

      // Location filter
      const matchesLocation = !selectedLocation || lead.company.location === selectedLocation;

      // Confidence filter
      const matchesConfidence = lead.confidence >= minConfidence;

      return matchesSearch && matchesIndustry && matchesLocation && matchesConfidence;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.company.name.localeCompare(b.company.name);
        case 'confidence':
          return b.confidence - a.confidence;
        case 'date':
          if (a.extractedAt && b.extractedAt) {
            return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime();
          }
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [leads, searchQuery, selectedIndustry, selectedLocation, minConfidence, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const highConfidenceCount = filteredLeads.filter((lead) => lead.confidence >= 0.8).length;
    const withContactsCount = filteredLeads.filter((lead) => lead.contacts.length > 0).length;
    return {
      total: filteredLeads.length,
      highConfidence: highConfidenceCount,
      withContacts: withContactsCount,
    };
  }, [filteredLeads]);

  const toggleSelect = (index: number) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedLeads(newSet);
  };

  const selectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((_, i) => i)));
    }
  };

  const getSelectedLeadsData = () => {
    return Array.from(selectedLeads).map((index) => filteredLeads[index]);
  };

  return (
    <div className="flex flex-col h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden">
      {/* Header with Stats */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {t('leads.title')}
          </h2>
          <div className="flex items-center gap-2">
            {selectedLeads.size > 0 && (
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {t('actions.selected', { count: selectedLeads.size })}
              </span>
            )}
            <TooltipWrapper content={t('actions.exportTooltip')}>
              <ExportButton
                leads={selectedLeads.size > 0 ? getSelectedLeadsData() : filteredLeads}
                format="csv"
              />
            </TooltipWrapper>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
              {t('leads.totalLeads', { count: stats.total })}
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
          </div>
          <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
              {t('leads.highConfidence', { count: stats.highConfidence })}
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.highConfidence}
            </div>
          </div>
          <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
              {t('leads.withContacts', { count: stats.withContacts })}
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {stats.withContacts}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        minConfidence={minConfidence}
        onConfidenceChange={setMinConfidence}
        sortBy={sortBy}
        onSortChange={setSortBy}
        industries={industries}
        locations={locations}
      />

      {/* Main Content: List + Detail */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: List */}
        <div className="w-80 border-r border-white/20">
          <LeadListPanel
            leads={filteredLeads}
            selectedLeadIndex={selectedLeadIndex}
            onLeadSelect={setSelectedLeadIndex}
            selectedLeads={selectedLeads}
            onToggleSelect={toggleSelect}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1">
          <LeadDetailPanel lead={selectedLeadIndex !== null ? filteredLeads[selectedLeadIndex] : null} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/20 bg-white/30 dark:bg-zinc-900/30 flex items-center justify-between">
        <button
          onClick={selectAll}
          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {selectedLeads.size === filteredLeads.length
            ? t('actions.deselectAll')
            : t('actions.selectAll')}
        </button>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {t('leads.lastUpdated')}: {format(new Date(), 'yyyy-MM-dd HH:mm')}
        </div>
      </div>
    </div>
  );
}
