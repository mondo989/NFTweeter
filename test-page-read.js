const { activateBrowser, readActivitySnapshot, resolveBrowserApp } = require('./src/pageReader');

async function testPageRead() {
  try {
    const browserApp = resolveBrowserApp();

    console.log('=== NFT Browser Text Read Test ===');
    console.log('This will read the configured activity row from the browser.\n');
    console.log(`Browser app: ${browserApp}`);

    console.log('Activating browser...');
    await activateBrowser(browserApp);

    console.log('Waiting 2 seconds for the page to settle...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Reading activity snapshot from the page...');
    const snapshot = await readActivitySnapshot(browserApp);

    console.log('\nCurrent snapshot:');
    console.log('------------------');
    console.log(JSON.stringify(snapshot, null, 2));
    console.log('------------------');
    console.log('\nNext steps:');
    console.log('1. Set ACTIVITY_SNAPSHOT_JS in .env if you want to override the built-in selectors');
    console.log('2. Make sure rarityText is returning the most recent sell rarity');
    console.log('3. Confirm saleText and imageUrl are the values you want for the post');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Make sure the browser is open on the activity page');
    console.log('- Make sure Terminal has Automation permission for the browser');
    console.log('- Check that the browser is showing the activity table and not another page');
  }
}

testPageRead();
