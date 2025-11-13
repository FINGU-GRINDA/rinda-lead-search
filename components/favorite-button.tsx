"use client";

import { useFavorites } from "@/lib/hooks/use-favorites";
import cn from "classnames";

interface FavoriteButtonProps {
  companyName: string;
  size?: number;
  className?: string;
}

export function FavoriteButton({ companyName, size = 16, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const starred = isFavorite(companyName);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(companyName);
      }}
      className={cn(
        "rounded-lg p-1.5 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
        starred && "text-yellow-500",
        !starred && "text-zinc-400 dark:text-zinc-600",
        className
      )}
      aria-label={starred ? "Remove from favorites" : "Add to favorites"}
      title={starred ? "Remove from favorites" : "Add to favorites"}
    >
      {starred ? (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </button>
  );
}
