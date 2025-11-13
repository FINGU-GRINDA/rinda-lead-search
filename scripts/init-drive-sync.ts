#!/usr/bin/env tsx

/**
 * Initial Google Drive Sync Script
 *
 * This script performs the initial synchronization of documents from Google Drive
 * to Gemini File Search. Run this once during setup.
 *
 * Usage: ***REMOVED***
 */

import { createDriveClient } from '../lib/google-drive';
import { createGeminiClient } from '../lib/gemini-file-search';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🚀 Starting initial Google Drive sync...\n');

  try {
    // Step 1: Initialize clients
    console.log('📦 Initializing Google Drive and Gemini clients...');
    const driveClient = createDriveClient();
    const geminiClient = createGeminiClient();
    console.log('✅ Clients initialized\n');

    // Step 2: Check Google Drive access
    console.log('🔍 Checking Google Drive access...');
    const hasAccess = await driveClient.checkFolderAccess();

    if (!hasAccess) {
      console.error('❌ Cannot access Google Drive folder. Please check:');
      console.error('   - Service account email is correct');
      console.error('   - Service account has access to the folder');
      console.error('   - Folder ID is correct');
      process.exit(1);
    }

    const folderInfo = await driveClient.getFolderInfo();
    console.log(`✅ Access confirmed: ${folderInfo.name}\n`);

    // Step 3: List files from Google Drive
    console.log('📂 Scanning Google Drive folder...');
    const files = await driveClient.listAllFiles();
    console.log(`✅ Found ${files.length} supported documents\n`);

    if (files.length === 0) {
      console.log('⚠️  No documents found to sync. Exiting.');
      process.exit(0);
    }

    // Show sample files
    console.log('📄 Sample documents:');
    files.slice(0, 5).forEach(file => {
      console.log(`   - ${file.name} (${file.mimeType})`);
    });
    if (files.length > 5) {
      console.log(`   ... and ${files.length - 5} more\n`);
    }

    // Step 4: Download files
    console.log('⬇️  Downloading documents from Google Drive...');
    const downloadedFiles: string[] = [];
    let downloadCount = 0;

    for (const file of files) {
      try {
        const localPath = await driveClient.downloadFile(file.id, file.name);
        downloadedFiles.push(localPath);
        downloadCount++;

        if (downloadCount % 10 === 0) {
          console.log(`   Downloaded ${downloadCount}/${files.length} files...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to download ${file.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`✅ Downloaded ${downloadedFiles.length} documents\n`);

    // Step 5: Create File Search Store
    console.log('🗄️  Creating Gemini File Search Store...');
    const store = await geminiClient.createFileSearchStore('Lead Search Documents');
    console.log(`✅ Store created: ${store.name}\n`);

    // Step 6: Upload to Gemini
    console.log('⬆️  Uploading documents to Gemini File Search...');
    const uploadedDocs = await geminiClient.batchUploadDocuments(
      downloadedFiles,
      (current, total) => {
        if (current % 5 === 0 || current === total) {
          console.log(`   Uploaded ${current}/${total} documents...`);
        }
      }
    );

    console.log(`✅ Uploaded ${uploadedDocs.length} documents\n`);

    // Step 7: Wait for processing
    console.log('⏳ Waiting for documents to be processed...');
    let processedCount = 0;

    for (const doc of uploadedDocs) {
      try {
        await geminiClient.waitForFileProcessing(doc.name, 120000);
        processedCount++;

        if (processedCount % 10 === 0) {
          console.log(`   Processed ${processedCount}/${uploadedDocs.length} documents...`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Timeout waiting for ${doc.displayName}`);
      }
    }

    console.log(`✅ All documents processed\n`);

    // Step 8: Save store ID to .env.local
    console.log('💾 Saving configuration...');
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add GEMINI_FILE_SEARCH_STORE_ID
    const storeIdPattern = /^GEMINI_FILE_SEARCH_STORE_ID=.*$/m;
    const storeIdLine = `GEMINI_FILE_SEARCH_STORE_ID=${store.name}`;

    if (storeIdPattern.test(envContent)) {
      envContent = envContent.replace(storeIdPattern, storeIdLine);
    } else {
      envContent += `\n${storeIdLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configuration saved to .env.local\n');

    // Summary
    console.log('🎉 Sync completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Documents found: ${files.length}`);
    console.log(`   - Documents downloaded: ${downloadedFiles.length}`);
    console.log(`   - Documents uploaded: ${uploadedDocs.length}`);
    console.log(`   - Store ID: ${store.name}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Start the development server: ***REMOVED***');
    console.log('   2. Click "Sync Google Drive" to verify');
    console.log('   3. Ask "extract leads" in the chat to find leads');

  } catch (error) {
    console.error('\n❌ Error during sync:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }

    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
