#!/usr/bin/env tsx

import { createGeminiClient } from '../lib/gemini-file-search';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔍 Checking Gemini uploaded files...\n');

  try {
    const geminiClient = createGeminiClient();

    // List all uploaded files
    const files = await geminiClient.listFiles();

    console.log(`📊 Total files in Gemini: ${files.length}\n`);

    if (files.length === 0) {
      console.log('⚠️  No files found in Gemini File Search.');
      console.log('💡 Files need to be uploaded first using the sync command.');
    } else {
      console.log('📄 Uploaded files:');

      const activeFiles = files.filter(f => f.state === 'ACTIVE');
      const processingFiles = files.filter(f => f.state === 'PROCESSING');
      const failedFiles = files.filter(f => f.state === 'FAILED');

      console.log(`\n✅ Active files: ${activeFiles.length}`);
      console.log(`⏳ Processing files: ${processingFiles.length}`);
      console.log(`❌ Failed files: ${failedFiles.length}\n`);

      if (activeFiles.length > 0) {
        console.log('Sample active files:');
        activeFiles.slice(0, 5).forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.displayName}`);
          console.log(`     State: ${file.state}`);
          console.log(`     Size: ${(parseInt(file.sizeBytes) / 1024).toFixed(2)} KB\n`);
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
