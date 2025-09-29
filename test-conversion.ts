#!/usr/bin/env tsx

import { FileConverter } from './server/services/file-converter.js';
import path from 'path';
import fs from 'fs-extra';
import { FileInfo } from './shared/schema';

async function testActualConversion() {
  console.log('🔄 Testing actual file conversion...');
  
  const converter = new FileConverter();
  
  // Look for a PDF file to test with
  const uploadsPath = path.resolve('./uploads');
  
  try {
    const folders = fs.readdirSync(uploadsPath);
    let testFile = null;
    
    for (const folder of folders) {
      const folderPath = path.join(uploadsPath, folder);
      const files = fs.readdirSync(folderPath);
      
      const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
      if (pdfFile) {
        testFile = {
          folder,
          file: pdfFile,
          fullPath: path.join(folderPath, pdfFile)
        };
        break;
      }
    }
    
    if (!testFile) {
      console.log('❌ No PDF files found in uploads directory');
      return;
    }
    
    console.log(`📄 Found test PDF: ${testFile.file}`);
    console.log(`📁 In folder: ${testFile.folder}`);
    
    // Create FileInfo object
    const fileInfo: FileInfo = {
      name: testFile.file,
      path: testFile.fullPath,
      size: fs.statSync(testFile.fullPath).size,
      type: 'application/pdf',
      extension: path.extname(testFile.file)
    };
    
    console.log('\n🔄 Testing PDF to TXT conversion...');
    
    // Test PDF to TXT conversion
    const txtResults = await converter.convertFiles(
      [fileInfo], 
      'txt', 
      testFile.folder,
      (progress) => console.log(`TXT Progress: ${progress}%`)
    );
    const txtResult = txtResults?.[0];
    
    if (txtResult) {
      console.log('✅ TXT Conversion successful!');
      console.log(`📝 Output: ${txtResult.name}`);
      console.log(`📊 Size: ${(txtResult.size / 1024).toFixed(2)} KB`);
      
      // Read first few lines of the converted text
      const txtContent = fs.readFileSync(txtResult.path, 'utf-8');
      console.log(`📖 Preview: ${txtContent.substring(0, 200)}...`);
    } else {
      console.log('❌ TXT conversion failed');
    }
    
    console.log('\n🔄 Testing PDF to PNG conversion...');
    
    // Test PDF to PNG conversion  
    const pngResults = await converter.convertFiles(
      [fileInfo],
      'png',
      testFile.folder,
      (progress) => console.log(`PNG Progress: ${progress}%`)
    );
    const pngResult = pngResults?.[0];
    
    if (pngResult) {
      console.log('✅ PNG Conversion successful!');
      console.log(`🖼️ Output: ${pngResult.name}`);
      console.log(`📊 Size: ${(pngResult.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ PNG conversion failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testActualConversion().catch(console.error);