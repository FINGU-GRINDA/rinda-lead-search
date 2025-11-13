'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/use-translation';

type AgentStatus = 'ready' | 'responding' | 'analyzing';

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const { t } = useTranslation();

  const statusConfig = {
    ready: {
      label: t('status.agent.ready'),
      color: 'bg-green-500',
      pulse: false,
    },
    responding: {
      label: t('status.agent.responding'),
      color: 'bg-blue-500',
      pulse: true,
    },
    analyzing: {
      label: t('status.agent.analyzing'),
      color: 'bg-purple-500',
      pulse: true,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.color} ${
            config.pulse ? 'animate-ping opacity-75' : ''
          }`}
        ></span>
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`}
        ></span>
      </div>
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        {config.label}
      </motion.span>
    </div>
  );
}
