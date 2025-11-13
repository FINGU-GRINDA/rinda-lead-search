#!/usr/bin/env tsx

import { createDriveClient } from '../lib/google-drive';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔍 Checking subfolder contents...\n');

  try {
    const driveClient = createDriveClient();

    // Get all folders
    const response = await driveClient['drive'].files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 10,
    });

    const folders = response.data.files || [];

    if (folders.length === 0) {
      console.log('No subfolders found');
      return;
    }

    // Check first folder
    const testFolder = folders[0];
    console.log(`📁 Checking folder: ${testFolder.name}\n`);

    // List files in subfolder
    const filesResponse = await driveClient['drive'].files.list({
      q: `'${testFolder.id}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 20,
    });

    const files = filesResponse.data.files || [];
    console.log(`📊 Files in "${testFolder.name}": ${files.length}\n`);

    if (files.length > 0) {
      files.forEach((file: any, index: number) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Type: ${file.mimeType}`);
        console.log(`   Size: ${file.size ? (parseInt(file.size) / 1024).toFixed(2) + ' KB' : 'N/A'}\n`);
      });

      // Check supported types
      const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/csv',
      ];

      const supportedFiles = files.filter((file: any) =>
        supportedTypes.includes(file.mimeType)
      );

      console.log(`✅ Supported files: ${supportedFiles.length}`);
      console.log(`📁 Total subfolders available: ${folders.length}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
