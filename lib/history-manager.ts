'use client';

import { Lead } from './schemas/lead';

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  leadCount: number;
  leads?: Lead[];
}

const HISTORY_KEY = 'rinda_search_history';
const MAX_HISTORY_ITEMS = 20;

export class HistoryManager {
  /**
   * Save a search to history
   */
  static saveSearch(query: string, leads: Lead[]): void {
    try {
      const history = this.getHistory();

      const newEntry: SearchHistory = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        timestamp: new Date(),
        leadCount: leads.length,
        leads: leads,
      };

      // Add to beginning of array
      history.unshift(newEntry);

      // Keep only the most recent MAX_HISTORY_ITEMS
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get all search history
   */
  static getHistory(): SearchHistory[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // Convert timestamp strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Get a specific search by ID
   */
  static getSearchById(id: string): SearchHistory | null {
    try {
      const history = this.getHistory();
      return history.find(item => item.id === id) || null;
    } catch (error) {
      console.error('Failed to get search by ID:', error);
      return null;
    }
  }

  /**
   * Delete a search from history
   */
  static deleteSearch(id: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete search:', error);
    }
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  /**
   * Get recent searches (last N items)
   */
  static getRecentSearches(count: number = 5): SearchHistory[] {
    try {
      const history = this.getHistory();
      return history.slice(0, count);
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Search history by query text
   */
  static searchHistory(searchText: string): SearchHistory[] {
    try {
      const history = this.getHistory();
      const lowerSearch = searchText.toLowerCase();

      return history.filter(item =>
        item.query.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Failed to search history:', error);
      return [];
    }
  }
}
