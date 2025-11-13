#!/usr/bin/env tsx

/**
 * Incremental Google Drive Sync Script
 *
 * This script syncs only new or modified documents from Google Drive to Gemini File Search.
 * Run this periodically to keep your document index up to date.
 *
 * Usage: npm run sync:incremental
 */

import { createDriveClient } from '../lib/google-drive';
import { createGeminiClient } from '../lib/gemini-file-search';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Track synced files
const SYNC_CACHE_FILE = path.join(process.cwd(), '.sync-cache.json');

interface SyncCache {
  lastSync: string;
  syncedFiles: {
    [fileId: string]: {
      name: string;
      modifiedTime: string;
      geminiFileId: string;
    };
  };
}

function loadSyncCache(): SyncCache {
  if (fs.existsSync(SYNC_CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(SYNC_CACHE_FILE, 'utf-8'));
  }
  return {
    lastSync: new Date(0).toISOString(),
    syncedFiles: {},
  };
}

function saveSyncCache(cache: SyncCache) {
  fs.writeFileSync(SYNC_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function main() {
  console.log('🔄 Starting incremental Google Drive sync...\n');

  try {
    // Load sync cache
    const syncCache = loadSyncCache();
    console.log(`📅 Last sync: ${new Date(syncCache.lastSync).toLocaleString()}\n`);

    // Initialize clients
    console.log('📦 Initializing clients...');
    const driveClient = createDriveClient();
    const geminiClient = createGeminiClient();
    console.log('✅ Clients initialized\n');

    // List files from Google Drive
    console.log('🔍 Checking for new or modified documents...');
    const allFiles = await driveClient.listAllFiles();

    // Filter for new/modified files
    const newOrModifiedFiles = allFiles.filter(file => {
      const cached = syncCache.syncedFiles[file.id];

      if (!cached) {
        return true; // New file
      }

      // Check if modified
      if (file.modifiedTime && cached.modifiedTime) {
        return new Date(file.modifiedTime) > new Date(cached.modifiedTime);
      }

      return false;
    });

    if (newOrModifiedFiles.length === 0) {
      console.log('✅ No new or modified documents found. Everything is up to date!\n');
      return;
    }

    console.log(`✅ Found ${newOrModifiedFiles.length} new or modified documents\n`);

    // Show sample files
    console.log('📄 Documents to sync:');
    newOrModifiedFiles.slice(0, 5).forEach(file => {
      const isNew = !syncCache.syncedFiles[file.id];
      console.log(`   ${isNew ? '🆕' : '📝'} ${file.name}`);
    });
    if (newOrModifiedFiles.length > 5) {
      console.log(`   ... and ${newOrModifiedFiles.length - 5} more\n`);
    }

    // Download files
    console.log('⬇️  Downloading documents...');
    const downloadedFiles: { path: string; id: string; name: string; modifiedTime?: string }[] = [];

    for (let i = 0; i < newOrModifiedFiles.length; i++) {
      const file = newOrModifiedFiles[i];
      try {
        const localPath = await driveClient.downloadFile(file.id, file.name);
        downloadedFiles.push({
          path: localPath,
          id: file.id,
          name: file.name,
          modifiedTime: file.modifiedTime,
        });

        if ((i + 1) % 5 === 0) {
          console.log(`   Downloaded ${i + 1}/${newOrModifiedFiles.length} files...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to download ${file.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`✅ Downloaded ${downloadedFiles.length} documents\n`);

    // Delete old versions from Gemini if they exist
    console.log('🗑️  Removing old versions from Gemini...');
    for (const file of downloadedFiles) {
      const cached = syncCache.syncedFiles[file.id];
      if (cached && cached.geminiFileId) {
        try {
          await geminiClient.deleteFile(cached.geminiFileId);
          console.log(`   Deleted old version: ${file.name}`);
        } catch (error) {
          console.warn(`   ⚠️  Could not delete old version: ${file.name}`);
        }
      }
    }
    console.log();

    // Upload to Gemini
    console.log('⬆️  Uploading new versions to Gemini...');
    const uploadedDocs = await geminiClient.batchUploadDocuments(
      downloadedFiles.map(f => f.path),
      (current, total) => {
        if (current % 5 === 0 || current === total) {
          console.log(`   Uploaded ${current}/${total} documents...`);
        }
      }
    );

    console.log(`✅ Uploaded ${uploadedDocs.length} documents\n`);

    // Wait for processing
    console.log('⏳ Waiting for documents to be processed...');
    for (let i = 0; i < uploadedDocs.length; i++) {
      const doc = uploadedDocs[i];
      try {
        await geminiClient.waitForFileProcessing(doc.name, 120000);

        if ((i + 1) % 5 === 0 || i + 1 === uploadedDocs.length) {
          console.log(`   Processed ${i + 1}/${uploadedDocs.length} documents...`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Timeout waiting for ${doc.displayName}`);
      }
    }

    console.log('✅ All documents processed\n');

    // Update sync cache
    console.log('💾 Updating sync cache...');
    uploadedDocs.forEach((doc, index) => {
      const file = downloadedFiles[index];
      syncCache.syncedFiles[file.id] = {
        name: file.name,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        geminiFileId: doc.name,
      };
    });

    syncCache.lastSync = new Date().toISOString();
    saveSyncCache(syncCache);
    console.log('✅ Cache updated\n');

    // Summary
    console.log('🎉 Incremental sync completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total documents in Drive: ${allFiles.length}`);
    console.log(`   - New/modified documents: ${newOrModifiedFiles.length}`);
    console.log(`   - Successfully synced: ${uploadedDocs.length}`);
    console.log(`   - Total documents in cache: ${Object.keys(syncCache.syncedFiles).length}`);

  } catch (error) {
    console.error('\n❌ Error during incremental sync:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
