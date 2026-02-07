import fetch from 'node-fetch';

interface TestResult {
    name: string;
    source: string;
    target: string;
    status: 'PASS' | 'FAIL';
    time: number;
    message: string;
}

const results: TestResult[] = [];

async function testConversion(testFilePath: string, targetFormat: string, testName: string): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`\n🧪 ${testName}`);

    try {
        // Use the test-convert API endpoint on port 9000
        const response = await fetch('http://localhost:9000/api/test-convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testFilePath, targetFormat }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        const { conversionId } = await response.json();

        // Poll for completion
        let status = 'processing';
        let attempts = 0;

        while (attempts < 60 && status === 'processing') {
            await new Promise(r => setTimeout(r, 500));
            const statusRes = await fetch(`http://localhost:9000/api/conversion/${conversionId}`);
            const statusData = await statusRes.json();
            status = statusData.status;
            attempts++;

            if (status === 'completed') {
                const time = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`   ✅ PASS (${time}s) - ${statusData.convertedFiles[0].convertedName}`);
                return {
                    name: testName,
                    source: testFilePath.split('/').pop() || '',
                    target: targetFormat,
                    status: 'PASS',
                    time: parseFloat(time),
                    message: `Success: ${statusData.convertedFiles[0].convertedName}`,
                };
            } else if (status === 'failed') {
                throw new Error('Conversion failed');
            }
        }

        throw new Error('Timeout');
    } catch (error: any) {
        const time = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   ❌ FAIL (${time}s) - ${error.message}`);
        return {
            name: testName,
            source: testFilePath.split('/').pop() || '',
            target: targetFormat,
            status: 'FAIL',
            time: parseFloat(time),
            message: error.message,
        };
    }
}

async function runTests() {
    console.log('🚀 Multi-File Conversion - Comprehensive Test Suite\n');
    console.log('═'.repeat(70));

    // Priority 1: Critical Documents
    console.log('\n📄 PRIORITY 1: Critical Document Conversions');
    console.log('─'.repeat(70));
    results.push(await testConversion('test-files/documents/sample.docx', 'pdf', 'DOCX → PDF (Formatting)'));
    results.push(await testConversion('test-files/documents/sample.md', 'pdf', 'Markdown → PDF (Two-Step)'));
    results.push(await testConversion('test-files/documents/sample.pdf', 'png', 'PDF → PNG'));
    results.push(await testConversion('test-files/documents/sample.txt', 'pdf', 'TXT → PDF'));

    // Priority 2: Data Formats
    console.log('\n📊 PRIORITY 2: Data Format Conversions');
    console.log('─'.repeat(70));
    results.push(await testConversion('test-files/documents/sample.json', 'yaml', 'JSON → YAML'));
    results.push(await testConversion('test-files/documents/sample.json', 'xml', 'JSON → XML'));
    results.push(await testConversion('test-files/documents/sample.json', 'toml', 'JSON → TOML'));
    results.push(await testConversion('test-files/documents/sample.yaml', 'json', 'YAML → JSON'));
    results.push(await testConversion('test-files/documents/sample.xml', 'json', 'XML → JSON'));
    results.push(await testConversion('test-files/documents/sample.csv', 'xlsx', 'CSV → XLSX'));
    results.push(await testConversion('test-files/documents/sample.csv', 'json', 'CSV → JSON'));

    // Priority 3: Images
    console.log('\n🖼️  PRIORITY 3: Image Conversions');
    console.log('─'.repeat(70));
    results.push(await testConversion('test-files/images/sample.jpg', 'png', 'JPG → PNG'));
    results.push(await testConversion('test-files/images/sample.jpg', 'webp', 'JPG → WEBP'));
    results.push(await testConversion('test-files/images/sample.png', 'jpg', 'PNG → JPG'));
    results.push(await testConversion('test-files/images/sample.webp', 'png', 'WEBP → PNG'));
    results.push(await testConversion('test-files/images/sample.svg', 'png', 'SVG → PNG'));
    results.push(await testConversion('test-files/images/sample.jpg', 'pdf', 'JPG → PDF'));

    // Priority 4: Audio (FFmpeg)
    console.log('\n🎵 PRIORITY 4: Audio Conversions (FFmpeg)');
    console.log('─'.repeat(70));
    results.push(await testConversion('test-files/audio/sample.mp3', 'wav', 'MP3 → WAV'));
    results.push(await testConversion('test-files/audio/sample.wav', 'mp3', 'WAV → MP3'));
    results.push(await testConversion('test-files/audio/sample.mp3', 'ogg', 'MP3 → OGG'));

    // Priority 5: Video (FFmpeg + NEW!)
    console.log('\n🎬 PRIORITY 5: Video Conversions (FFmpeg + NEW!)');
    console.log('─'.repeat(70));
    results.push(await testConversion('test-files/video/sample.mp4', 'gif', 'MP4 → GIF ⭐ NEW!'));
    results.push(await testConversion('test-files/video/sample.mp4', 'webm', 'MP4 → WEBM'));
    results.push(await testConversion('test-files/video/sample.mp4', 'avi', 'MP4 → AVI'));

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(70));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const avgTime = (results.reduce((sum, r) => sum + r.time, 0) / results.length).toFixed(2);

    console.log(`\n✅ PASSED: ${passed}/${results.length}`);
    console.log(`❌ FAILED: ${failed}/${results.length}`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Time: ${avgTime}s`);

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   • ${r.name}: ${r.message}`);
        });
    }

    console.log('\n✅ Passed Tests:');
    results.filter(r => r.status === 'PASS').forEach((r, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${r.name} (${r.time}s)`);
    });

    console.log('\n💾 Full results saved to: test-results.json\n');

    const fs = await import('fs/promises');
    await fs.writeFile('test-results.json', JSON.stringify(results, null, 2));

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
