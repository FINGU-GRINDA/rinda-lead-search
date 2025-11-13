'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/use-translation';
import { TooltipWrapper } from './tooltip-wrapper';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  minConfidence: number;
  onConfidenceChange: (confidence: number) => void;
  sortBy: 'name' | 'confidence' | 'date';
  onSortChange: (sort: 'name' | 'confidence' | 'date') => void;
  industries: string[];
  locations: string[];
}

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  selectedIndustry,
  onIndustryChange,
  selectedLocation,
  onLocationChange,
  minConfidence,
  onConfidenceChange,
  sortBy,
  onSortChange,
  industries,
  locations,
}: FilterToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-white/20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-zinc-400"
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
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('leads.search')}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Industry Filter */}
        <TooltipWrapper content={t('leads.filterByIndustry')}>
          <select
            value={selectedIndustry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{t('leads.filterByIndustry')}</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </TooltipWrapper>

        {/* Location Filter */}
        <TooltipWrapper content={t('leads.filterByLocation')}>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{t('leads.filterByLocation')}</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </TooltipWrapper>

        {/* Confidence Filter */}
        <TooltipWrapper content={t('leadCard.confidenceTooltip')}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {t('leads.filterByConfidence')}:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence * 100}
              onChange={(e) => onConfidenceChange(Number(e.target.value) / 100)}
              className="w-20 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {Math.round(minConfidence * 100)}%+
            </span>
          </div>
        </TooltipWrapper>

        {/* Sort */}
        <TooltipWrapper content={t('leads.sortBy')}>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'name' | 'confidence' | 'date')}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="name">{t('leads.sortByName')}</option>
            <option value="confidence">{t('leads.sortByConfidence')}</option>
            <option value="date">{t('leads.sortByDate')}</option>
          </select>
        </TooltipWrapper>
      </div>
    </div>
  );
}
