import { NextRequest, NextResponse } from 'next/server';
import { createDriveClient } from '@/lib/google-drive';
import { createGeminiClient } from '@/lib/gemini-file-search';
import { DriveSyncJob } from '@/lib/schemas/lead';
import { v4 as uuidv4 } from 'uuid';

// In-memory job storage (in production, use a database)
const syncJobs = new Map<string, DriveSyncJob>();

export const maxDuration = 300; // 5 minutes max execution time
export const dynamic = 'force-dynamic';

/**
 * POST /api/drive/sync
 * Initiates a Google Drive folder sync to Gemini File Search
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folderId, maxDocuments = 100 } = body;

    // Use configured folder ID if not provided
    const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!targetFolderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = uuidv4();
    const job: DriveSyncJob = {
      jobId,
      folderId: targetFolderId,
      status: 'scanning',
      filesFound: 0,
      filesProcessed: 0,
      filesFailed: 0,
      progress: 0,
      startedAt: new Date(),
    };

    syncJobs.set(jobId, job);

    // Start sync process asynchronously
    processSyncJob(jobId, targetFolderId, maxDocuments).catch(error => {
      console.error(`Error processing sync job ${jobId}:`, error);
      const failedJob = syncJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.completedAt = new Date();
        syncJobs.set(jobId, failedJob);
      }
    });

    return NextResponse.json({
      jobId,
      status: 'scanning',
      message: 'Drive sync initiated. Use /api/drive/status/{jobId} to check progress.',
    });
  } catch (error) {
    console.error('Error initiating drive sync:', error);
    return NextResponse.json(
      { error: 'Failed to initiate drive sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/drive/sync
 * Lists all sync jobs
 */
export async function GET() {
  try {
    const jobs = Array.from(syncJobs.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error listing sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to list sync jobs' },
      { status: 500 }
    );
  }
}

/**
 * Process sync job asynchronously
 */
async function processSyncJob(
  jobId: string,
  folderId: string,
  maxDocuments: number
) {
  const updateJob = (updates: Partial<DriveSyncJob>) => {
    const job = syncJobs.get(jobId);
    if (job) {
      syncJobs.set(jobId, { ...job, ...updates });
    }
  };

  try {
    // Initialize clients
    const driveClient = createDriveClient();
    const geminiClient = createGeminiClient();

    // Step 1: Scan Google Drive
    updateJob({ status: 'scanning', progress: 10 });
    console.log(`[${jobId}] Scanning Google Drive folder: ${folderId}`);

    const files = await driveClient.listAllFiles();
    const limitedFiles = files.slice(0, maxDocuments);

    updateJob({
      filesFound: limitedFiles.length,
      progress: 20,
    });

    console.log(`[${jobId}] Found ${limitedFiles.length} files`);

    // Step 2: Download files
    updateJob({ status: 'downloading', progress: 30 });

    const downloadedFiles: string[] = [];
    for (let i = 0; i < limitedFiles.length; i++) {
      const file = limitedFiles[i];
      try {
        console.log(`[${jobId}] Downloading ${file.name} (${i + 1}/${limitedFiles.length})`);
        const localPath = await driveClient.downloadFile(file.id, file.name);
        downloadedFiles.push(localPath);

        const downloadProgress = 30 + ((i + 1) / limitedFiles.length) * 30;
        updateJob({ progress: downloadProgress });
      } catch (error) {
        console.error(`[${jobId}] Failed to download ${file.name}:`, error);
        updateJob({
          filesFailed: (syncJobs.get(jobId)?.filesFailed || 0) + 1,
        });
      }
    }

    console.log(`[${jobId}] Downloaded ${downloadedFiles.length} files successfully`);

    // Step 3: Upload to Gemini File Search
    updateJob({ status: 'uploading', progress: 60 });

    const uploadedDocs = await geminiClient.batchUploadDocuments(
      downloadedFiles,
      (current, total) => {
        const uploadProgress = 60 + (current / total) * 30;
        updateJob({
          filesProcessed: current,
          progress: uploadProgress,
        });
        console.log(`[${jobId}] Uploaded ${current}/${total} documents to Gemini`);
      }
    );

    console.log(`[${jobId}] Uploaded ${uploadedDocs.length} documents to Gemini File Search`);

    // Step 4: Wait for indexing
    updateJob({ status: 'indexing', progress: 90 });

    // Wait for files to be processed
    for (const doc of uploadedDocs) {
      try {
        await geminiClient.waitForFileProcessing(doc.name, 120000); // 2 minutes max per file
      } catch (error) {
        console.warn(`[${jobId}] Timeout or error waiting for ${doc.name} to process`);
      }
    }

    // Complete
    updateJob({
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
    });

    console.log(`[${jobId}] Sync completed successfully`);

    // Clean up local files (optional)
    // In production, you might want to keep them or delete them
  } catch (error) {
    console.error(`[${jobId}] Sync process failed:`, error);
    updateJob({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date(),
    });
    throw error;
  }
}

/**
 * Get sync job by ID
 */
export function getSyncJob(jobId: string): DriveSyncJob | undefined {
  return syncJobs.get(jobId);
}
