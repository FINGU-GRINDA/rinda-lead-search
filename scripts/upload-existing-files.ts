#!/usr/bin/env tsx

import { createGeminiClient } from '../lib/gemini-file-search';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const TEMP_DIR = path.join(process.env.TEMP || 'C:\\Users\\hogin\\AppData\\Local\\Temp', 'lead-search-documents');

async function main() {
  console.log('🚀 Starting upload of existing files...\n');

  try {
    const geminiClient = createGeminiClient();

    // Get already uploaded files
    console.log('📋 Checking already uploaded files...');
    const uploadedFiles = await geminiClient.listFiles();
    const uploadedNames = new Set(uploadedFiles.map(f => f.displayName));
    console.log(`✅ Already uploaded: ${uploadedFiles.length} files\n`);

    // Get all local files
    console.log('📂 Scanning local files...');
    const localFiles = fs.readdirSync(TEMP_DIR)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(TEMP_DIR, file));

    console.log(`✅ Found ${localFiles.length} local files\n`);

    // Filter out already uploaded files
    const filesToUpload = localFiles.filter(filePath => {
      const fileName = path.basename(filePath);
      return !uploadedNames.has(fileName);
    });

    console.log(`⬆️  Files to upload: ${filesToUpload.length}\n`);

    if (filesToUpload.length === 0) {
      console.log('✅ All files are already uploaded!');
      return;
    }

    // Upload files with progress
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const filePath = filesToUpload[i];
      const fileName = path.basename(filePath);

      try {
        await geminiClient.uploadDocument(filePath, fileName);
        uploaded++;

        if ((i + 1) % 10 === 0) {
          console.log(`   Progress: ${uploaded}/${filesToUpload.length} files uploaded...`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Failed to upload ${fileName}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Add small delay to avoid rate limiting
      if ((i + 1) % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Upload completed!`);
    console.log(`   Uploaded: ${uploaded} files`);
    console.log(`   Failed: ${failed} files`);
    console.log(`   Total in Gemini: ${uploadedFiles.length + uploaded} files`);

    // Check final status
    console.log('\n🔍 Verifying final status...');
    const finalFiles = await geminiClient.listFiles();
    const activeFiles = finalFiles.filter(f => f.state === 'ACTIVE');
    const processingFiles = finalFiles.filter(f => f.state === 'PROCESSING');

    console.log(`✅ Active files: ${activeFiles.length}`);
    console.log(`⏳ Processing files: ${processingFiles.length}`);
    console.log(`📊 Total files: ${finalFiles.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);
