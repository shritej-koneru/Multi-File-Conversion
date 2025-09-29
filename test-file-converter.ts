#!/usr/bin/env tsx
import { FileConverter } from './server/services/file-converter.js';

async function testFileConverter() {
  console.log('🧪 Testing FileConverter...\n');
  
  const converter = new FileConverter();
  
  // Test 1: Get supported conversions for different file types
  console.log('📋 Supported conversions:');
  
  const testFiles = [
    { ext: '.pdf', name: 'PDF files' },
    { ext: '.jpg', name: 'JPEG images' },
    { ext: '.png', name: 'PNG images' },
    { ext: '.docx', name: 'Word documents' },
    { ext: '.mp4', name: 'MP4 videos' },
    { ext: '.mp3', name: 'MP3 audio' },
  ];
  
  for (const file of testFiles) {
    try {
      const formats = converter.getSupportedConversions(file.ext);
      console.log(`  ${file.name} (${file.ext}): ${formats.join(', ')}`);
    } catch (error) {
      console.log(`  ${file.name} (${file.ext}): Error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n✅ FileConverter test completed successfully!');
}

// Run the test
testFileConverter().catch(console.error);