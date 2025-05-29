const { screen, Region, keyboard, Key, mouse, Button, clipboard, straightTo, Point } = require('@nut-tree-fork/nut-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { extractTextWithRetry } = require('./ocr');
const { extractSaleData, hasRarityChanged } = require('./extract');
const { generateTweet } = require('./tweetGenerator');
const { postTweet, openTwitterCompose } = require('./twitterBot');

// Configuration
const OPENSEA_URL = process.env.OPENSEA_URL || 'https://opensea.io/collection/apuapustajas';
const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS) || 60000;
const LAST_SALE_FILE = path.join(__dirname, '..', 'data', 'lastSale.json');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// Define the region to capture (will need to be adjusted based on screen)
// These values should be configured based on your screen resolution
// Positioned at bottom of screen, wider horizontally for better OCR capture
const RARITY_REGION = new Region(200, 800, 1000, 200); // x, y, width, height

/**
 * Ensures the screenshots directory exists
 * @returns {Promise<void>}
 */
async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists, ignore error
  }
}

/**
 * Opens Safari and navigates to the OpenSea collection
 * @returns {Promise<void>}
 */
async function openSafariToCollection() {
  try {
    console.log('Opening Safari and navigating to collection...');
    
    // Open Safari using Spotlight
    await keyboard.pressKey(Key.LeftSuper, Key.Space);
    await keyboard.releaseKey(Key.LeftSuper, Key.Space);
    await sleep(500);
    keyboard.config.autoDelayMs = 10;
    await keyboard.type('Chrome');
    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    await sleep(1000);
    
    // Open new tab
    await keyboard.pressKey(Key.LeftSuper, Key.L);
    await keyboard.releaseKey(Key.LeftSuper, Key.L);
    await sleep(500);
    
    // Navigate to the collection URL
    keyboard.config.autoDelayMs = 10;
    await keyboard.type(OPENSEA_URL);
    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    await sleep(2000); // Wait for page to load
    
    console.log('Safari opened and navigated to collection');
  } catch (error) {
    console.error('Failed to open Safari:', error.message);
    throw error;
  }
}

/**
 * Loads the last sale data from file
 * @returns {Promise<Object>} - The last sale data
 */
async function loadLastSale() {
  try {
    const data = await fs.readFile(LAST_SALE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No previous sale data found, starting fresh');
    return { rarityNumber: null, lastChecked: null };
  }
}

/**
 * Saves the current sale data to file
 * @param {number} rarityNumber - The rarity number to save
 * @returns {Promise<void>}
 */
async function saveLastSale(rarityNumber) {
  const data = {
    rarityNumber,
    lastChecked: new Date().toISOString()
  };
  await fs.writeFile(LAST_SALE_FILE, JSON.stringify(data, null, 2));
  console.log('Saved last sale data:', data);
}

/**
 * Captures a screenshot of the rarity region for OCR text extraction
 * This is COMPLETELY SEPARATE from the NFT details page capture
 * Used only to detect rarity number changes on the collection page
 * @returns {Promise<Buffer>} - The screenshot buffer
 */
async function captureRarityRegion() {
  try {
    console.log('Capturing rarity region for OCR text extraction...');
    
    // Use a specific filename for rarity region capture (separate from NFT details)
    const rarityScreenshotPath = path.join(__dirname, '..', 'current-capture.png');
    console.log(`Saving rarity region screenshot to: ${rarityScreenshotPath}`);
    
    // Use screen.captureRegion to save the image directly to file
    await screen.captureRegion(rarityScreenshotPath, RARITY_REGION);
    console.log(`Rarity region screenshot saved successfully`);
    console.log(`Rarity capture region: x=${RARITY_REGION.left}, y=${RARITY_REGION.top}, width=${RARITY_REGION.width}, height=${RARITY_REGION.height}`);
    
    // Verify the file exists before trying to read it
    try {
      await fs.access(rarityScreenshotPath);
      console.log('Rarity region screenshot file verified to exist');
    } catch (accessError) {
      throw new Error(`Rarity region screenshot was not created at ${rarityScreenshotPath}`);
    }
    
    // Read the saved file to return as buffer for OCR
    const rarityBuffer = await fs.readFile(rarityScreenshotPath);
    
    console.log('Rarity region screenshot captured successfully for OCR');
    console.log(`Rarity buffer size: ${rarityBuffer.length} bytes`);
    return rarityBuffer;
  } catch (error) {
    console.error('Failed to capture rarity region screenshot:', error.message);
    throw error;
  }
}

/**
 * Captures a screenshot of the NFT details page for AI analysis
 * Captures almost full page excluding top 30% (browser UI, navigation, etc.)
 * @returns {Promise<Buffer>} - The screenshot buffer
 */
async function captureNFTDetailsPage() {
  try {
    console.log('Capturing NFT details page for AI analysis...');
    
    // Get screen dimensions for full page capture (excluding top 30%)
    const fullScreenWidth = await screen.width();
    const fullScreenHeight = await screen.height();
    
    // Capture almost full page, excluding top 30% (browser UI, navigation)
    const startX = 0; // Start from left edge
    const startY = Math.floor(fullScreenHeight * 0.3); // Start from 30% down (skip browser UI)
    const captureWidth = fullScreenWidth; // Full width
    const captureHeight = Math.floor(fullScreenHeight * 0.7); // 70% of screen height
    
    const NFT_DETAILS_REGION = new Region(startX, startY, captureWidth, captureHeight);
    
    // Use a completely separate filename for NFT details page
    const nftDetailsPath = path.join(__dirname, '..', 'nft-details-page.png');
    console.log(`Saving NFT details page screenshot to: ${nftDetailsPath}`);
    
    // Capture the NFT details page region
    await screen.captureRegion(nftDetailsPath, NFT_DETAILS_REGION);
    console.log(`NFT details page screenshot saved successfully`);
    console.log(`NFT details capture region: x=${NFT_DETAILS_REGION.left}, y=${NFT_DETAILS_REGION.top}, width=${NFT_DETAILS_REGION.width}, height=${NFT_DETAILS_REGION.height}`);
    
    // Verify the file exists before trying to read it
    try {
      await fs.access(nftDetailsPath);
      console.log('NFT details page screenshot file verified to exist');
    } catch (accessError) {
      throw new Error(`NFT details page screenshot was not created at ${nftDetailsPath}`);
    }
    
    // Read the saved file to return as buffer for AI analysis
    const detailsBuffer = await fs.readFile(nftDetailsPath);
    
    console.log('NFT details page captured successfully for AI analysis');
    console.log(`NFT details buffer size: ${detailsBuffer.length} bytes`);
    return detailsBuffer;
  } catch (error) {
    console.error('Failed to capture NFT details page:', error.message);
    throw error;
  }
}

/**
 * Clicks on the NFT at the bottom-left area of the page
 * @returns {Promise<string>} - The URL of the clicked NFT
 */
async function clickOnNFT() {
  try {
    console.log('Moving mouse to NFT location and clicking...');
    
    // Get screen dimensions to calculate bottom-left position
    const screenWidth = await screen.width();
    const screenHeight = await screen.height();
    
    // Position slightly from bottom and left (adjust these values as needed)
    const clickX = Math.floor(screenWidth * 0.33); // 30% from left
    const clickY = Math.floor(screenHeight * 0.87); // 85% from top (near bottom)
    
    console.log(`Clicking at position: x=${clickX}, y=${clickY}`);
    
    // Move mouse to position and click
    await mouse.setPosition({ x: clickX, y: clickY });
    await sleep(500); // Small delay to ensure mouse is positioned
    await mouse.leftClick();
    
    console.log('NFT clicked successfully');
    await sleep(2000); // Wait for page to load after click

    // Extract the URL to pass to chatgpt
    await keyboard.pressKey(Key.LeftSuper, Key.L);
    await keyboard.releaseKey(Key.LeftSuper, Key.L);
    await sleep(500);
    await keyboard.pressKey(Key.LeftSuper, Key.X);
    await keyboard.releaseKey(Key.LeftSuper, Key.X);
    await sleep(500);
    await keyboard.pressKey(Key.Escape);
    await keyboard.releaseKey(Key.Escape);
    await sleep(500);

    // Get URL from clipboard
    const nftUrl = await clipboard.getContent();
    console.log('Captured NFT URL:', nftUrl);

    // // Right click on the image to open context menu
    // await mouse.rightClick();
    // await sleep(1000); // Wait for context menu to appear
    
    // // Move mouse slightly up and right to click on "Copy image" option in dropdown
    // const currentPos = await mouse.getPosition();
    // const newPos = new Point(currentPos.x + 12, currentPos.y - 100); // 50px right, 50px up
    // await mouse.move(straightTo(newPos));
    // await sleep(300);
    // await mouse.leftClick();
    // console.log('Clicked on copy image option');
    
    return nftUrl;
  } catch (error) {
    console.error('Failed to click on NFT:', error.message);
    throw error;
  }
}


/**
 * Main monitoring loop
 */
async function monitor() {
  console.log('NFT Sales Monitor starting...');
  console.log(`Monitoring URL: ${OPENSEA_URL}`);
  console.log(`Check interval: ${CHECK_INTERVAL_MS}ms`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}`);
  
  // Ensure screenshots directory exists
  await ensureScreenshotsDir();
  
  // Load last sale data
  let lastSaleData = await loadLastSale();
  
  // Main loop
  while (true) {
    try {
      console.log('\n--- Starting new check ---');
      console.log(`Time: ${new Date().toISOString()}`);
      
      // Capture the rarity region
      const screenshot = await captureRarityRegion();
      
      // Debug: Check what we're passing to OCR
      console.log('Screenshot buffer type:', typeof screenshot);
      console.log('Screenshot buffer length:', screenshot ? screenshot.length : 'null');
      
      // Perform OCR with retry
      const ocrText = await extractTextWithRetry(screenshot);
      console.log('OCR Result:', ocrText);
      
      // Extract sale data
      const saleData = extractSaleData(ocrText);
      
      // Check if rarity has changed
      if (hasRarityChanged(saleData.rarity, lastSaleData.rarityNumber)) {
        console.log('🎉 New sale detected!');
        console.log(`Previous number: #${lastSaleData.rarityNumber || 'N/A'}`);
        console.log(`New number: #${saleData.rarity}`);
        
        // Click on the NFT first and get the URL
        const nftUrl = await clickOnNFT();
        
        // Take a screenshot of the NFT details page for AI analysis
        console.log('Taking screenshot of NFT details page for AI analysis...');
        await sleep(2000); // Wait for page to fully load
        const nftScreenshot = await captureNFTDetailsPage(); // Capture almost full page excluding top 30%
        
        // Generate tweet with AI analysis of the NFT image
        const tweetText = await generateTweet(saleData, nftUrl, nftScreenshot);
        
        // Post tweet (using the compose window method for safety)
        await openTwitterCompose(tweetText);
        
        // Save the new rarity number
        await saveLastSale(saleData.rarity);
        lastSaleData.rarityNumber = saleData.rarity;
        
      } else {
        console.log('No change detected');
        console.log(`Current number: #${saleData.rarity || 'N/A'}`);
      }
      
    } catch (error) {
      console.error('Error in monitoring loop:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Wait for next check
    console.log(`Waiting ${CHECK_INTERVAL_MS / 1000} seconds until next check...`);
    await sleep(CHECK_INTERVAL_MS);
  }
}

/**
 * Helper function to add delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Entry point
 */
async function main() {
  console.log('=================================');
  console.log('NFT Sales Twitter Bot');
  console.log('=================================');
  console.log('\nIMPORTANT: Before running this bot, ensure:');
  console.log('1. You have granted Screen Recording permission to Terminal/Node');
  console.log('2. You have granted Accessibility permission to Terminal/Node');
  console.log('3. You are logged into Twitter in your browser');
  console.log('4. You have set your OPENAI_API_KEY in .env file');
  console.log('\nThe bot will automatically open Safari and navigate to the collection page.');
  console.log('Screenshots will be saved for debugging purposes.');
  console.log('\nPress Ctrl+C to stop the bot\n');
  
  // Give user time to read the message
  await sleep(3000);
  
  // Open Safari and navigate to collection
  await openSafariToCollection();
  
  // Start monitoring
  await monitor();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down NFT Sales Monitor...');
  process.exit(0);
});

// Run the bot
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  monitor,
  captureRarityRegion,
  openSafariToCollection
}; 