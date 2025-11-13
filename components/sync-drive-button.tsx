'use client';

import { useState, useEffect } from 'react';
import { RefreshCwIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from './icons';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'processing';
  message?: string;
  filesProcessed?: number;
  totalFiles?: number;
  activeFiles?: number;
}

export function SyncDriveButton() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    // Check file status on mount
    checkFileStatus();
  }, []);

  useEffect(() => {
    if (jobId && syncStatus.status === 'syncing') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/drive/status/${jobId}`);
          const data = await response.json();

          if (data.status === 'completed') {
            setSyncStatus({
              status: 'success',
              message: `동기화 완료! ${data.filesProcessed || 0}개 파일 처리됨`,
              filesProcessed: data.filesProcessed,
            });
            setJobId(null);
            // Wait a bit then check active files
            setTimeout(checkFileStatus, 2000);
          } else if (data.status === 'failed') {
            setSyncStatus({
              status: 'error',
              message: `동기화 실패: ${data.error || '알 수 없는 오류'}`,
            });
            setJobId(null);
          } else if (data.status === 'processing') {
            setSyncStatus({
              status: 'syncing',
              message: `처리 중... (${data.filesProcessed || 0}/${data.totalFiles || '?'}개)`,
              filesProcessed: data.filesProcessed,
              totalFiles: data.totalFiles,
            });
          }
        } catch (error) {
          console.error('Error checking sync status:', error);
          setSyncStatus({
            status: 'error',
            message: '상태 확인 실패',
          });
          setJobId(null);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, syncStatus.status]);

  const checkFileStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.gemini?.activeFiles !== undefined) {
        setSyncStatus({
          status: data.gemini.activeFiles > 0 ? 'processing' : 'idle',
          activeFiles: data.gemini.activeFiles,
          message: data.gemini.activeFiles > 0
            ? `${data.gemini.activeFiles}개 파일 활성화됨`
            : '동기화가 필요합니다',
        });
      }
    } catch (error) {
      console.error('Error checking file status:', error);
    }
  };

  const handleSync = async () => {
    setSyncStatus({ status: 'syncing', message: '동기화 시작 중...' });

    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDocuments: 100,
        }),
      });

      const data = await response.json();

      if (data.jobId) {
        setJobId(data.jobId);
        setSyncStatus({
          status: 'syncing',
          message: '동기화 진행 중...',
        });
      } else {
        setSyncStatus({
          status: 'error',
          message: data.error || '동기화 시작 실패',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({
        status: 'error',
        message: '동기화 요청 실패',
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCwIcon size={16} className="animate-spin" />;
      case 'success':
        return <CheckCircleIcon size={16} />;
      case 'error':
        return <XCircleIcon size={16} />;
      case 'processing':
        return <CheckCircleIcon size={16} />;
      default:
        return <RefreshCwIcon size={16} />;
    }
  };

  const getButtonText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return syncStatus.message || '동기화 중...';
      case 'success':
        return '동기화 완료';
      case 'error':
        return '재시도';
      case 'processing':
        return `활성 파일: ${syncStatus.activeFiles || 0}개`;
      default:
        return 'Google Drive 동기화';
    }
  };

  const isDisabled = syncStatus.status === 'syncing';

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            syncStatus.status === 'error'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : syncStatus.status === 'success'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : syncStatus.status === 'processing'
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {getStatusIcon()}
        <span>{getButtonText()}</span>
      </button>

      {syncStatus.message && syncStatus.status !== 'idle' && (
        <div
          className={`
            text-sm px-3 py-2 rounded-md flex items-center gap-2
            ${
              syncStatus.status === 'error'
                ? 'bg-red-900/20 text-red-400 border border-red-800'
                : syncStatus.status === 'success'
                ? 'bg-green-900/20 text-green-400 border border-green-800'
                : syncStatus.status === 'syncing'
                ? 'bg-blue-900/20 text-blue-400 border border-blue-800'
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }
          `}
        >
          {syncStatus.status === 'syncing' && (
            <AlertCircleIcon size={16} />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {syncStatus.status === 'idle' && syncStatus.activeFiles === 0 && (
        <div className="text-sm text-gray-400 px-3 py-2 bg-gray-800/50 rounded-md border border-gray-700">
          💡 Lead 검색을 사용하려면 먼저 Google Drive 문서를 동기화하세요
        </div>
      )}
    </div>
  );
}
