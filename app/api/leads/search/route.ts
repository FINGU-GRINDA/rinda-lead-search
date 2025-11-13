import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/gemini-file-search';
import { LeadExtractor } from '@/lib/lead-extractor';

export async function POST(request: NextRequest) {
  try {
    const { query, maxLeads = 50, minConfidence = 0.6 } = await request.json();

    // Create Gemini client and lead extractor
    const geminiClient = createGeminiClient();
    const leadExtractor = new LeadExtractor(geminiClient);

    // Get list of uploaded files
    const uploadedFiles = await geminiClient.listFiles();
    const activeFiles = uploadedFiles.filter(f => f.state === 'ACTIVE');

    if (activeFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No documents available. Please sync documents from Google Drive first.',
        leads: [],
      }, { status: 400 });
    }

    // Extract leads from documents - pass file objects instead of names
    const result = await leadExtractor.extractLeads(activeFiles, query, {
      maxLeads,
      minConfidence,
    });

    return NextResponse.json({
      success: true,
      leads: result.leads,
      metadata: {
        totalDocuments: activeFiles.length,
        averageConfidence: result.averageConfidence,
        extractedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    // Enhanced error logging
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : { message: String(error) };
    
    console.error('Lead search error:', {
      error: errorDetails,
      query: query || 'none',
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search leads',
      leads: [],
    }, { status: 500 });
  }
}
