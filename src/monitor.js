const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { activateBrowser, readActivitySnapshot } = require('./pageReader');
const { extractSaleData, hasRarityChanged } = require('./extract');
const { generateTweet } = require('./tweetGenerator');
const { openTwitterCompose } = require('./twitterBot');

const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS, 10) || 60000;
const LAST_SALE_FILE = path.join(__dirname, '..', 'data', 'lastSale.json');
const BROWSER_APP = process.env.BROWSER_APP || 'Brave Browser';
const ACTIVITY_URL = process.env.ACTIVITY_URL || process.env.MONITOR_URL || 'https://opensea.io/collection/apuapustajas/activity?activityTypes=sale';

async function loadLastSale() {
  try {
    const data = await fs.readFile(LAST_SALE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No previous sale data found, starting fresh');
    return { rarityNumber: null, saleUrl: null, saleId: null, lastChecked: null };
  }
}

async function saveLastSale(saleData) {
  const data = {
    rarityNumber: saleData.rarity,
    saleUrl: saleData.saleUrl || null,
    saleId: saleData.saleId || null,
    lastChecked: new Date().toISOString()
  };
  await fs.writeFile(LAST_SALE_FILE, JSON.stringify(data, null, 2));
  console.log('Saved last sale data:', data);
}

async function monitor() {
  console.log('NFT Sales Monitor starting...');
  console.log(`Browser app: ${BROWSER_APP}`);
  console.log(`Activity URL: ${ACTIVITY_URL}`);
  console.log(`Check interval: ${CHECK_INTERVAL_MS}ms`);
  console.log('Reading the configured activity row from browser DOM text.');

  let lastSaleData = await loadLastSale();

  while (true) {
    try {
      console.log('\n--- Starting new check ---');
      console.log(`Time: ${new Date().toISOString()}`);

      const snapshot = await readActivitySnapshot(BROWSER_APP);
      console.log('Browser snapshot:', snapshot);

      const saleData = extractSaleData(snapshot);
      console.log('Parsed sale data:', saleData);

      if (saleData.rarity === null || saleData.rarity === undefined) {
        throw new Error('Could not parse a rarity number from the configured row text');
      }

      if (hasRarityChanged(saleData.rarity, lastSaleData.rarityNumber)) {
        console.log('New sale detected!');
        console.log(`Previous number: #${lastSaleData.rarityNumber || 'N/A'}`);
        console.log(`New number: #${saleData.rarity}`);

        const tweetText = await generateTweet(saleData);

        await openTwitterCompose(tweetText, saleData.imageUrl);

        await saveLastSale(saleData);
        lastSaleData.rarityNumber = saleData.rarity;
        lastSaleData.saleUrl = saleData.saleUrl || null;
        lastSaleData.saleId = saleData.saleId || null;
      } else {
        console.log('No change detected');
        console.log(`Current number: #${saleData.rarity || 'N/A'}`);
      }
    } catch (error) {
      console.error('Error in monitoring loop:', error.message);
      console.error('Stack trace:', error.stack);
    }

    console.log(`Waiting ${CHECK_INTERVAL_MS / 1000} seconds until next check...`);
    await sleep(CHECK_INTERVAL_MS);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=================================');
  console.log('NFT Sales Twitter Bot');
  console.log('=================================');
  console.log('\nIMPORTANT: Before running this bot, ensure:');
  console.log('1. You have granted Accessibility permission to Terminal/Node');
  console.log('2. You have granted Automation permission for your browser');
  console.log('3. The browser is already open on the activity page');
  console.log('4. Set ACTIVITY_SNAPSHOT_JS in .env only if you need to override the built-in selectors');
  console.log('\nThe bot will activate the browser and start reading the configured row text.');
  console.log('No screenshots are used in this flow.');
  console.log('\nPress Ctrl+C to stop the bot\n');

  await sleep(3000);

  await activateBrowser(BROWSER_APP, ACTIVITY_URL);
  await monitor();
}

process.on('SIGINT', () => {
  console.log('\n\nShutting down NFT Sales Monitor...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  activateBrowser,
  monitor
};
