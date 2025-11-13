#!/usr/bin/env tsx

import { createDriveClient } from '../lib/google-drive';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔍 Checking Google Drive folder contents...\n');

  try {
    const driveClient = createDriveClient();

    // Get folder info
    const folderInfo = await driveClient.getFolderInfo();
    console.log(`📁 Folder: ${folderInfo.name}`);
    console.log(`📁 Folder ID: ${folderInfo.id}\n`);

    // List ALL files without filtering
    const response = await driveClient['drive'].files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 100,
    });

    const allFiles = response.data.files || [];
    console.log(`📊 Total files found: ${allFiles.length}\n`);

    if (allFiles.length === 0) {
      console.log('⚠️  Folder is empty or service account does not have access to files.');
      console.log('\n💡 Solutions:');
      console.log('1. Make sure the Google Drive folder contains documents');
      console.log('2. Verify the folder is shared with the service account');
      console.log('3. Check that the service account has at least "Viewer" permissions');
    } else {
      console.log('📄 Files in folder:');
      allFiles.forEach((file: any, index: number) => {
        console.log(`\n${index + 1}. ${file.name}`);
        console.log(`   Type: ${file.mimeType}`);
        console.log(`   Size: ${file.size ? (parseInt(file.size) / 1024).toFixed(2) + ' KB' : 'N/A'}`);
        console.log(`   Modified: ${file.modifiedTime}`);
      });

      // Check supported types
      const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      const supportedFiles = allFiles.filter((file: any) =>
        supportedTypes.includes(file.mimeType)
      );

      console.log(`\n\n✅ Supported files: ${supportedFiles.length}`);
      console.log(`❌ Unsupported files: ${allFiles.length - supportedFiles.length}`);

      if (supportedFiles.length === 0) {
        console.log('\n⚠️  No supported file types found!');
        console.log('Supported types: PDF, DOCX, DOC, TXT, CSV, XLSX, XLS');
        console.log('\nUnsupported files found:');
        const unsupported = allFiles.filter((file: any) =>
          !supportedTypes.includes(file.mimeType)
        );
        unsupported.forEach((file: any) => {
          console.log(`   - ${file.name} (${file.mimeType})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

main().catch(console.error);
