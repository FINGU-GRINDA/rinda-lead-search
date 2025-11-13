import { useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'rinda-lead-favorites';

interface FavoriteItem {
  companyName: string;
  timestamp: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed: FavoriteItem[] = JSON.parse(stored);
        setFavorites(new Set(parsed.map(item => item.companyName)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = (companyName: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(companyName)) {
        newFavorites.delete(companyName);
      } else {
        newFavorites.add(companyName);
      }
      
      const favoritesArray: FavoriteItem[] = Array.from(newFavorites).map(name => ({
        companyName: name,
        timestamp: Date.now(),
      }));
      
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
      
      return newFavorites;
    });
  };

  const isFavorite = (companyName: string): boolean => {
    return favorites.has(companyName);
  };

  const clearFavorites = () => {
    setFavorites(new Set());
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear favorites:', error);
    }
  };

  return {
    favorites: Array.from(favorites),
    isFavorite,
    toggleFavorite,
    clearFavorites,
    isLoading,
  };
}
