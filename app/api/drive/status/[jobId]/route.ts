import { NextRequest, NextResponse } from 'next/server';
import { getSyncJob } from '../../sync/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/status/[jobId]
 * Check the status of a drive sync job
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const job = getSyncJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job,
      message: getStatusMessage(job.status),
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    scanning: 'Scanning Google Drive folder...',
    downloading: 'Downloading documents from Google Drive...',
    uploading: 'Uploading documents to Gemini File Search...',
    indexing: 'Indexing documents for search...',
    completed: 'Sync completed successfully!',
    failed: 'Sync failed. Please check the error message.',
  };

  return messages[status] || 'Processing...';
}
