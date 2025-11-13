'use client';

import { useEffect } from 'react';

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;
        const metaMatch = s.meta ? event.metaKey : !event.metaKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export function getShortcutLabel(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Common shortcuts for the application
export const GLOBAL_SHORTCUTS = {
  SEARCH: {
    key: 'k',
    ctrl: true,
    description: 'Focus search input',
  },
  ESCAPE: {
    key: 'Escape',
    description: 'Close modal/Clear input',
  },
  HELP: {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
  },
  NEW_SEARCH: {
    key: 'n',
    ctrl: true,
    description: 'New search',
  },
  TOGGLE_HISTORY: {
    key: 'h',
    ctrl: true,
    shift: true,
    description: 'Toggle search history',
  },
  ANALYZE_WEBSITE: {
    key: 'w',
    ctrl: true,
    description: 'Analyze website',
  },
  EXPORT: {
    key: 'e',
    ctrl: true,
    description: 'Export leads',
  },
  TOGGLE_LANGUAGE: {
    key: 'l',
    ctrl: true,
    shift: true,
    description: 'Toggle language',
  },
};
