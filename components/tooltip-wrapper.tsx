'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

interface TooltipWrapperProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

export function TooltipWrapper({
  children,
  content,
  side = 'top',
  delayDuration = 200
}: TooltipWrapperProps) {
  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            className="z-50 px-3 py-2 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg border border-white/10 max-w-xs backdrop-blur-xl"
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
