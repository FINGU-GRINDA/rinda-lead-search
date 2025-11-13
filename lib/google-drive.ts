import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DriveConfig {
  serviceAccountEmail: string;
  privateKey: string;
  folderId: string;
}

/**
 * Supported document MIME types for lead extraction
 */
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/vnd.ms-excel', // XLS
];

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx', '.xls'];

/**
 * Google Drive API Client
 */
export class GoogleDriveClient {
  private drive: any;
  private auth: JWT;
  private folderId: string;

  constructor(config: DriveConfig) {
    // Initialize JWT auth
    this.auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: config.privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    // Initialize Drive API
    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.folderId = config.folderId;
  }

  /**
   * List all files in the configured folder
   */
  async listFiles(options?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    try {
      const query = `'${this.folderId}' in parents and trashed = false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)',
        pageSize: options?.maxResults || 100,
        pageToken: options?.pageToken,
        orderBy: 'modifiedTime desc',
      });

      const allFiles = response.data.files || [];

      // Filter for supported file types
      const supportedFiles = allFiles.filter((file: any) => {
        const hasValidMimeType = SUPPORTED_MIME_TYPES.includes(file.mimeType);
        const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext =>
          file.name.toLowerCase().endsWith(ext)
        );
        return hasValidMimeType || hasValidExtension;
      });

      return {
        files: supportedFiles,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all files recursively (handles pagination and subfolders)
   */
  async listAllFiles(): Promise<DriveFile[]> {
    const allFiles: DriveFile[] = [];

    // Get files from root folder
    let pageToken: string | undefined;
    do {
      const result = await this.listFiles({ pageToken });
      allFiles.push(...result.files);
      pageToken = result.nextPageToken;
    } while (pageToken);

    // Get subfolders
    const subfolders = await this.listSubfolders(this.folderId);

    // Recursively get files from each subfolder
    for (const subfolder of subfolders) {
      const subfolderFiles = await this.listFilesInFolder(subfolder.id);
      allFiles.push(...subfolderFiles);
    }

    return allFiles;
  }

  /**
   * List subfolders in a folder
   */
  private async listSubfolders(folderId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 1000,
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing subfolders:', error);
      return [];
    }
  }

  /**
   * List files in a specific folder
   */
  private async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
        pageSize: 1000,
      });

      const files = response.data.files || [];

      // Filter for supported file types
      const supportedFiles = files.filter((file: any) => {
        const hasValidMimeType = SUPPORTED_MIME_TYPES.includes(file.mimeType);
        const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext =>
          file.name.toLowerCase().endsWith(ext)
        );
        return hasValidMimeType || hasValidExtension;
      });

      return supportedFiles;
    } catch (error) {
      console.error(`Error listing files in folder ${folderId}:`, error);
      return [];
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string, fileName: string): Promise<string> {
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'lead-search-documents');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate file path
      const filePath = path.join(tempDir, `${fileId}_${fileName}`);

      // Download file
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      // Write to file
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(filePath);
        response.data
          .on('end', () => resolve(filePath))
          .on('error', (err: Error) => reject(err))
          .pipe(dest);
      });
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting file metadata for ${fileId}:`, error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if folder is accessible
   */
  async checkFolderAccess(): Promise<boolean> {
    try {
      await this.drive.files.get({
        fileId: this.folderId,
        fields: 'id, name',
      });
      return true;
    } catch (error) {
      console.error('Error accessing folder:', error);
      return false;
    }
  }

  /**
   * Get folder information
   */
  async getFolderInfo(): Promise<{ id: string; name: string }> {
    try {
      const response = await this.drive.files.get({
        fileId: this.folderId,
        fields: 'id, name',
      });
      return response.data;
    } catch (error) {
      console.error('Error getting folder info:', error);
      throw new Error(`Failed to get folder info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create a Google Drive client from environment variables
 */
export function createDriveClient(): GoogleDriveClient {
  const config: DriveConfig = {
    serviceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY || '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  };

  if (!config.serviceAccountEmail || !config.privateKey || !config.folderId) {
    throw new Error(
      'Missing required Google Drive configuration. Please check your environment variables.'
    );
  }

  return new GoogleDriveClient(config);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext;
}

/**
 * Check if file is supported for processing
 */
export function isSupportedFile(filename: string, mimeType: string): boolean {
  const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext =>
    filename.toLowerCase().endsWith(ext)
  );
  const hasValidMimeType = SUPPORTED_MIME_TYPES.includes(mimeType);

  return hasValidExtension || hasValidMimeType;
}
