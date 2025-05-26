const { captureRarityRegion, openSafariToCollection } = require('./src/monitor');
const fs = require('fs');

async function testCapture() {
  try {
    console.log('=== NFT Bot Screenshot Test ===');
    console.log('This will help you find the correct coordinates for the rarity region.\n');
    
    // Ask user if they want to open Safari first
    console.log('Opening Safari and navigating to collection...');
    await openSafariToCollection();
    
    console.log('Waiting 3 seconds for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Capturing screenshot of rarity region...');
    const buffer = await captureRarityRegion();
    
    // Save to project root for easy access
    fs.writeFileSync('test-capture.png', buffer);
    console.log('\n✅ Screenshot saved as test-capture.png');
    console.log('📍 Current region coordinates:');
    console.log('   new Region(850, 400, 200, 60) // x, y, width, height');
    console.log('\n📋 Next steps:');
    console.log('1. Open test-capture.png to see what was captured');
    console.log('2. If the rarity number is not visible, adjust coordinates in src/monitor.js');
    console.log('3. Use an image editor to find the correct pixel coordinates');
    console.log('4. Update the RARITY_REGION object in src/monitor.js:');
    console.log('   const RARITY_REGION = new Region(x, y, width, height);');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure you have granted Screen Recording permission');
    console.log('- Make sure you have granted Accessibility permission');
    console.log('- Ensure Safari can be opened and controlled');
  }
}

// Run the test
testCapture(); 