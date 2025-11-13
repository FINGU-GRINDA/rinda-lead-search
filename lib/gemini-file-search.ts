import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as path from 'path';

export interface FileSearchStore {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
}

export interface UploadedDocument {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  state: string;
  createTime: string;
  metadata?: Record<string, string | number>;
}

export interface FileMetadata {
  key: string;
  value: string | number;
}

export interface FileSearchConfig {
  apiKey: string;
  storeId?: string;
}

export interface QueryResult {
  text: string;
  citations?: Array<{
    source: string;
    startIndex: number;
    endIndex: number;
  }>;
}

/**
 * Gemini File Search Client
 * Manages document upload and querying using Gemini's File Search API
 */
export class GeminiFileSearchClient {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private storeId?: string;

  constructor(config: FileSearchConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.fileManager = new GoogleAIFileManager(config.apiKey);
    this.storeId = config.storeId;
  }

  /**
   * Create a new File Search Store
   */
  async createFileSearchStore(displayName: string): Promise<FileSearchStore> {
    try {
      // Note: The Google GenAI SDK might not have direct File Search Store creation
      // We'll use the Files API and track the store ID manually
      console.log(`Creating File Search Store: ${displayName}`);

      // For now, we'll use a pseudo-store approach
      // In production, you might need to use the REST API directly
      const store: FileSearchStore = {
        name: `stores/${Date.now()}`,
        displayName,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      };

      this.storeId = store.name;
      return store;
    } catch (error) {
      console.error('Error creating File Search Store:', error);
      throw new Error(`Failed to create File Search Store: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a document to the File Search Store with retry logic
   */
  async uploadDocument(
    filePath: string,
    displayName?: string,
    metadata?: Record<string, string | number>,
    maxRetries: number = 3
  ): Promise<UploadedDocument> {
    const fileName = displayName || path.basename(filePath);
    const mimeType = this.getMimeType(filePath);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Upload file to Gemini using GoogleAIFileManager
        const uploadResult = await this.fileManager.uploadFile(filePath, {
          mimeType,
          displayName: fileName,
        });

        console.log(`Uploaded file: ${fileName} (${uploadResult.file.name})`);

        return {
          name: uploadResult.file.name,
          displayName: fileName,
          mimeType: uploadResult.file.mimeType,
          sizeBytes: uploadResult.file.sizeBytes?.toString() || '0',
          state: uploadResult.file.state,
          createTime: new Date().toISOString(),
          metadata,
        };
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (isLastAttempt) {
          console.error(`Error uploading document ${filePath} after ${maxRetries} attempts:`, error);
          throw new Error(`Failed to upload document after ${maxRetries} attempts: ${errorMsg}`);
        } else {
          console.warn(`Upload attempt ${attempt}/${maxRetries} failed for ${fileName}, retrying in 2s...`);
          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // This should never be reached due to throw in loop, but TypeScript needs it
    throw new Error('Failed to upload document');
  }

  /**
   * Batch upload multiple documents
   */
  async batchUploadDocuments(
    filePaths: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<UploadedDocument[]> {
    const uploaded: UploadedDocument[] = [];
    const total = filePaths.length;

    for (let i = 0; i < filePaths.length; i++) {
      try {
        const doc = await this.uploadDocument(filePaths[i]);
        uploaded.push(doc);

        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`Failed to upload ${filePaths[i]}:`, error);
        // Continue with next file
      }
    }

    return uploaded;
  }

  /**
   * Query with text content directly (alternative to fileData references)
   * This method accepts file content as text and passes it to Gemini
   */
  async queryWithTextContent(
    query: string,
    textContent: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      systemInstruction?: string;
      sourceName?: string;
    }
  ): Promise<QueryResult> {
    try {
      console.log(`Querying Gemini 2.5 Pro with text content (${textContent.length} characters)`);

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
        systemInstruction: options?.systemInstruction,
      });

      // Create a combined prompt with the text content
      const combinedPrompt = `${query}

--- Document Content ---
${textContent}
--- End of Document Content ---

Please analyze the above document content and respond according to the query.`;

      console.log(`Sending query with text content to Gemini 2.5 Pro`);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxOutputTokens ?? 8192,
          responseMimeType: 'application/json',
        },
      });

      const response = result.response;
      const text = response.text();

      console.log(`Successfully received response from Gemini (${text.length} characters)`);

      return {
        text,
        citations: options?.sourceName ? [{ source: options.sourceName, startIndex: 0, endIndex: 0 }] : [],
      };
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : { message: String(error) };

      console.error('Error querying with text content:', errorDetails);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
          throw new Error('Invalid or missing API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY environment variable.');
        }
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          throw new Error('API quota exceeded or rate limit reached. Please try again later.');
        }
      }

      throw new Error(`Failed to query with text content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query documents using File Search with Gemini 2.5 Pro
   */
  async queryWithFileSearch(
    query: string,
    files: UploadedDocument[],
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      systemInstruction?: string;
    }
  ): Promise<QueryResult> {
    try {
      // Validate files
      if (!files || files.length === 0) {
        throw new Error('No files provided for query');
      }

      // Filter only ACTIVE files
      const activeFiles = files.filter(f => f.state === 'ACTIVE');
      if (activeFiles.length === 0) {
        throw new Error('No active files available. Please wait for files to finish processing.');
      }

      // IMPORTANT: Gemini API has a limit on the number of files per request
      // Test with 1 file first to verify API works
      const MAX_FILES_PER_REQUEST = 1;

      let filesToQuery = activeFiles;
      if (activeFiles.length > MAX_FILES_PER_REQUEST) {
        console.log(`⚠️ Too many files (${activeFiles.length}). Limiting to ${MAX_FILES_PER_REQUEST} files.`);

        // Try to select files that might be relevant to the query
        // For queries containing country/region names, prioritize matching files
        const queryLower = query.toLowerCase();
        const relevantFiles = activeFiles.filter(f => {
          const displayNameLower = f.displayName?.toLowerCase() || '';
          // Simple keyword matching - can be improved with better logic
          return queryLower.split(' ').some(word =>
            word.length > 3 && displayNameLower.includes(word)
          );
        });

        if (relevantFiles.length > 0 && relevantFiles.length <= MAX_FILES_PER_REQUEST) {
          filesToQuery = relevantFiles;
          console.log(`📌 Found ${relevantFiles.length} relevant files matching query keywords`);
        } else if (relevantFiles.length > MAX_FILES_PER_REQUEST) {
          filesToQuery = relevantFiles.slice(0, MAX_FILES_PER_REQUEST);
          console.log(`📌 Selected first ${MAX_FILES_PER_REQUEST} from ${relevantFiles.length} relevant files`);
        } else {
          // No relevant files found, use first N files
          filesToQuery = activeFiles.slice(0, MAX_FILES_PER_REQUEST);
          console.log(`📌 No relevant files found. Using first ${MAX_FILES_PER_REQUEST} files`);
        }
      }

      console.log(`Querying ${filesToQuery.length} active files with Gemini 2.5 Pro`);

      // Use gemini-2.5-pro for best quality lead extraction
      // NOTE: gemini-1.5-pro/flash were retired in April 2025
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
        systemInstruction: options?.systemInstruction,
      });

      // Create parts for the request using file metadata
      // Gemini API expects fileUri to be the full URI format
      // file.name from uploadFile response is already in the correct format (e.g., "files/abc123")
      const parts: Array<{ text: string } | { fileData: { fileUri: string; mimeType: string } }> = [
        { text: query },
      ];

      // Add file data parts - file.name is already in the correct format from the API
      for (const file of filesToQuery) {
        // file.name from GoogleAIFileManager.uploadFile is already in format "files/{file_id}"
        // We should use it directly without modification
        const fileUri = file.name;
        
        console.log(`Adding file to query: ${file.displayName} (${fileUri}), mimeType: ${file.mimeType}, state: ${file.state}`);
        
        parts.push({
          fileData: {
            fileUri: fileUri,
            mimeType: file.mimeType || 'application/octet-stream',
          },
        });
      }

      console.log(`Sending query with ${parts.length - 1} file references to Gemini 2.5 Pro`);

      // Log the request structure for debugging
      console.log('Request structure:', JSON.stringify({
        partsCount: parts.length,
        hasText: parts.some(p => 'text' in p),
        fileCount: parts.filter(p => 'fileData' in p).length,
        firstFileUri: parts.find(p => 'fileData' in p) ? (parts.find(p => 'fileData' in p) as any).fileData?.fileUri : null,
      }, null, 2));

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxOutputTokens ?? 8192,
          responseMimeType: 'application/json', // Request JSON response for structured data
        },
      });

      const response = result.response;
      const text = response.text();

      console.log(`Successfully received response from Gemini (${text.length} characters)`);

      return {
        text,
        citations: this.extractCitations(response),
      };
    } catch (error) {
      // Enhanced error logging with full error details
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        // Try to extract more details from the error object
        ...(error as any).cause ? { cause: (error as any).cause } : {},
        ...(error as any).status ? { status: (error as any).status } : {},
        ...(error as any).statusText ? { statusText: (error as any).statusText } : {},
      } : { message: String(error) };
      
      console.error('Error querying with File Search:', {
        error: errorDetails,
        filesCount: files?.length || 0,
        activeFilesCount: files?.filter(f => f.state === 'ACTIVE').length || 0,
        queryLength: query.length,
        fileNames: files?.map(f => ({ name: f.name, displayName: f.displayName, state: f.state })) || [],
      });

      // Provide more specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
          throw new Error('Invalid or missing API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY environment variable.');
        }
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          throw new Error('API quota exceeded or rate limit reached. Please try again later.');
        }
        if (errorMessage.includes('file') || errorMessage.includes('not found')) {
          throw new Error(`File processing error: ${error.message}. Please ensure files are uploaded and in ACTIVE state.`);
        }
        if (errorMessage.includes('invalid') && errorMessage.includes('file')) {
          throw new Error(`Invalid file format or file not accessible: ${error.message}`);
        }
        if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          throw new Error(`Permission denied: ${error.message}. Please check file access permissions.`);
        }
      }

      // Re-throw with original error message for debugging
      throw new Error(`Failed to query documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.fileManager.deleteFile(fileName);
      console.log(`Deleted file: ${fileName}`);
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all uploaded files with pagination support
   */
  async listFiles(): Promise<UploadedDocument[]> {
    try {
      const allFiles: UploadedDocument[] = [];
      let pageToken: string | undefined = undefined;

      // Paginate through all files
      do {
        const response = await this.fileManager.listFiles({
          pageSize: 100, // Max page size
          pageToken: pageToken,
        });

        // Handle cases where response or files might be undefined
        if (!response || !response.files) {
          break;
        }

        // Map files to our format
        const mappedFiles = response.files.map(file => ({
          name: file.name,
          displayName: file.displayName || file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes?.toString() || '0',
          state: file.state,
          createTime: file.createTime || new Date().toISOString(),
        }));

        allFiles.push(...mappedFiles);

        // Get next page token if available
        pageToken = response.nextPageToken;
      } while (pageToken);

      return allFiles;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file info
   */
  async getFile(fileName: string): Promise<UploadedDocument> {
    try {
      const file = await this.fileManager.getFile(fileName);

      return {
        name: file.name,
        displayName: file.displayName || file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes?.toString() || '0',
        state: file.state,
        createTime: file.createTime || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting file ${fileName}:`, error);
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for file processing to complete
   */
  async waitForFileProcessing(fileName: string, maxWaitMs: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const file = await this.getFile(fileName);

      if (file.state === 'ACTIVE') {
        return;
      }

      if (file.state === 'FAILED') {
        throw new Error(`File processing failed for ${fileName}`);
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Timeout waiting for file processing: ${fileName}`);
  }

  /**
   * Get MIME type from file path
   * Supports various document, spreadsheet, and text formats
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      // Documents
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',

      // Spreadsheets
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.csv': 'text/csv',

      // Presentations
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',

      // Data formats
      '.json': 'application/json',
      '.xml': 'application/xml',

      // Code files (for documents that might contain lead info)
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.html': 'text/html',
      '.css': 'text/css',
      '.md': 'text/markdown',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Extract citations from response
   * Based on Gemini File Search grounding metadata
   */
  private extractCitations(response: any): Array<{ source: string; startIndex: number; endIndex: number }> {
    const citations: Array<{ source: string; startIndex: number; endIndex: number }> = [];

    try {
      // Extract grounding metadata if available
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];

        // Check for grounding metadata
        if (candidate.groundingMetadata) {
          const metadata = candidate.groundingMetadata;

          // Process grounding chunks (file references)
          if (metadata.groundingChunks) {
            metadata.groundingChunks.forEach((chunk: any, index: number) => {
              const source = chunk.web?.uri ||
                           chunk.file?.name ||
                           chunk.retrievedContext?.uri ||
                           `Document chunk ${index + 1}`;

              citations.push({
                source,
                startIndex: chunk.startIndex || 0,
                endIndex: chunk.endIndex || 0,
              });
            });
          }

          // Process grounding supports (specific text references)
          if (metadata.groundingSupports) {
            metadata.groundingSupports.forEach((support: any, index: number) => {
              if (support.segment) {
                citations.push({
                  source: support.segment.text || `Support ${index + 1}`,
                  startIndex: support.segment.startIndex || 0,
                  endIndex: support.segment.endIndex || 0,
                });
              }
            });
          }
        }

        // Fallback: check for citation metadata in content parts
        if (candidate.content?.parts) {
          candidate.content.parts.forEach((part: any) => {
            if (part.fileData) {
              citations.push({
                source: part.fileData.fileUri || 'Unknown file',
                startIndex: 0,
                endIndex: 0,
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not extract citations:', error);
    }

    return citations;
  }

  /**
   * Get current store ID
   */
  getStoreId(): string | undefined {
    return this.storeId;
  }

  /**
   * Set store ID
   */
  setStoreId(storeId: string): void {
    this.storeId = storeId;
  }
}

/**
 * Create Gemini File Search client from environment variables
 */
export function createGeminiClient(): GeminiFileSearchClient {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const storeId = process.env.GEMINI_FILE_SEARCH_STORE_ID;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
  }

  return new GeminiFileSearchClient({ apiKey, storeId });
}
