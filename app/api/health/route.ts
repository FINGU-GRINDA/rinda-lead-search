import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/gemini-file-search';

/**
 * Health check endpoint
 * Returns system status and file statistics
 */
export async function GET(request: NextRequest) {
  try {
    const healthStatus: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        hasGeminiApiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        hasDriveConfig: !!(
          process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL &&
          process.env.GOOGLE_DRIVE_PRIVATE_KEY
        ),
        hasDriveFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
        hasStoreId: !!process.env.GEMINI_FILE_SEARCH_STORE_ID,
      },
      gemini: {
        connected: false,
        activeFiles: 0,
        totalFiles: 0,
        processingFiles: 0,
        failedFiles: 0,
      },
    };

    // Try to connect to Gemini and get file stats
    try {
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        const geminiClient = createGeminiClient();
        const files = await geminiClient.listFiles();

        healthStatus.gemini.connected = true;
        healthStatus.gemini.totalFiles = files.length;
        healthStatus.gemini.activeFiles = files.filter(f => f.state === 'ACTIVE').length;
        healthStatus.gemini.processingFiles = files.filter(f => f.state === 'PROCESSING').length;
        healthStatus.gemini.failedFiles = files.filter(f => f.state === 'FAILED').length;

        // Add file details for debugging
        if (files.length > 0) {
          healthStatus.gemini.files = files.map(f => ({
            name: f.displayName,
            state: f.state,
            uri: f.name,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          }));
        }
      }
    } catch (geminiError) {
      console.error('Gemini health check failed:', geminiError);
      healthStatus.gemini.error = geminiError instanceof Error ? geminiError.message : 'Unknown error';
      healthStatus.status = 'degraded';
    }

    // Overall health assessment
    const issues: string[] = [];

    if (!healthStatus.environment.hasGeminiApiKey) {
      issues.push('Missing GOOGLE_GENERATIVE_AI_API_KEY');
    }
    if (!healthStatus.environment.hasDriveConfig) {
      issues.push('Missing Google Drive service account configuration');
    }
    if (!healthStatus.environment.hasDriveFolderId) {
      issues.push('Missing GOOGLE_DRIVE_FOLDER_ID');
    }
    if (!healthStatus.gemini.connected) {
      issues.push('Cannot connect to Gemini API');
    }
    if (healthStatus.gemini.activeFiles === 0 && healthStatus.gemini.connected) {
      issues.push('No active files available for search');
    }

    if (issues.length > 0) {
      healthStatus.issues = issues;
      if (healthStatus.status !== 'degraded') {
        healthStatus.status = 'warning';
      }
    }

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'healthy' ? 200 :
              healthStatus.status === 'warning' ? 200 : 503,
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
