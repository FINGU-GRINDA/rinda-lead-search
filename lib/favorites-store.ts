'use client';

import { Lead } from './schemas/lead';

const FAVORITES_KEY = 'rinda_favorites';

export class FavoritesStore {
  /**
   * Get all favorite lead IDs
   */
  static getFavorites(): string[] {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  /**
   * Check if a lead is favorited
   */
  static isFavorite(leadId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.includes(leadId);
  }

  /**
   * Add lead to favorites
   */
  static addFavorite(leadId: string): void {
    try {
      const favorites = this.getFavorites();
      if (!favorites.includes(leadId)) {
        favorites.push(leadId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  }

  /**
   * Remove lead from favorites
   */
  static removeFavorite(leadId: string): void {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(id => id !== leadId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(leadId: string): boolean {
    const isFav = this.isFavorite(leadId);
    if (isFav) {
      this.removeFavorite(leadId);
      return false;
    } else {
      this.addFavorite(leadId);
      return true;
    }
  }

  /**
   * Clear all favorites
   */
  static clearFavorites(): void {
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error('Failed to clear favorites:', error);
    }
  }

  /**
   * Get favorite count
   */
  static getCount(): number {
    return this.getFavorites().length;
  }
}

/**
 * Generate a unique ID for a lead
 */
export function generateLeadId(lead: Lead): string {
  return `${lead.company.name}-${lead.contacts[0]?.name || 'unknown'}`.toLowerCase().replace(/\s+/g, '-');
}
