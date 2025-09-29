#!/usr/bin/env tsx

import { FileConverter } from './server/services/file-converter.js';
import path from 'path';

async function testConverter() {
  console.log('🧪 Testing File Converter...');
  
  const converter = new FileConverter();
  
  // Test 1: Get supported conversions for a PDF
  console.log('\n📝 PDF Supported Conversions:');
  const pdfConversions = converter.getSupportedConversions('.pdf');
  console.log(pdfConversions);
  
  // Test 2: Get supported conversions for an image
  console.log('\n🖼️ PNG Supported Conversions:');
  const pngConversions = converter.getSupportedConversions('.png');
  console.log(pngConversions);
  
  // Test 3: Get supported conversions for a document
  console.log('\n📄 DOCX Supported Conversions:');
  const docxConversions = converter.getSupportedConversions('.docx');
  console.log(docxConversions);
  
  // Test 4: Check if we have any test files in uploads
  console.log('\n📁 Looking for test files...');
  const uploadsPath = path.resolve('./uploads');
  
  try {
    const fs = await import('fs');
    const folders = fs.readdirSync(uploadsPath);
    console.log(`Found ${folders.length} upload folders`);
    
    for (const folder of folders.slice(0, 3)) { // Check first 3 folders
      const folderPath = path.join(uploadsPath, folder);
      const files = fs.readdirSync(folderPath);
      console.log(`📂 ${folder}: ${files.length} files`);
      files.forEach(file => console.log(`  - ${file}`));
    }
  } catch (error) {
    console.log('No uploads directory found or empty');
  }
  
  console.log('\n✅ File Converter test completed!');
}

testConverter().catch(console.error);