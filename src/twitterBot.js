const { keyboard, Key } = require('@nut-tree-fork/nut-js');
const { execFile } = require('child_process');
const fs = require('fs').promises;
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const BROWSER_APP = process.env.BROWSER_APP || 'Brave Browser';
const OPENSEA_URL = process.env.OPENSEA_URL || 'https://opensea.io/collection/apuapustajas';
const RETURN_URL = process.env.ACTIVITY_URL || process.env.MONITOR_URL || 'https://opensea.io/collection/apuapustajas/activity?activityTypes=sale';

/**
 * Posts a tweet using Brave automation
 * Assumes user is already logged into Twitter in Brave
 * @param {string} tweetText - The text to tweet
 * @returns {Promise<void>}
 */
async function postTweet(tweetText) {
  try {
    console.log('Starting Twitter post automation...');

    await runCommand('open', ['-a', BROWSER_APP]);
    await sleep(1000);
    await keyboard.type(Key.Cmd, Key.L);
    await sleep(300);
    await keyboard.type('https://twitter.com/');
    await keyboard.type(Key.Return);
    await sleep(1000);

    keyboard.config.autoDelayMs = 5;
    await typeMultilineText(tweetText);
    await sleep(500);

    await keyboard.type(Key.Cmd, Key.Return);
    await sleep(1000);

    console.log('Tweet posted successfully!');

    await keyboard.type(Key.Cmd, Key.W);
  } catch (error) {
    console.error('Failed to post tweet:', error.message);
    throw error;
  }
}

/**
 * Opens Twitter compose in Brave and pastes the tweet plus image
 * @param {string} tweetText - The text to tweet
 * @param {string} imageUrl - The OpenSea image URL
 * @returns {Promise<void>}
 */
async function openTwitterCompose(tweetText, imageUrl = '') {
  try {
    console.log('Opening Twitter compose window...');
    console.log('Tweet text to post:', tweetText);
    console.log('Image URL:', imageUrl || 'N/A');

    await runCommand('open', ['-a', BROWSER_APP, 'https://twitter.com/']);
    console.log('Twitter compose window opened in browser');

    await sleep(5000);

    await keyboard.pressKey(Key.N);
    await keyboard.releaseKey(Key.N);
    await sleep(1000);

    console.log('Typing tweet text...');
    keyboard.config.autoDelayMs = 5;
    await typeMultilineText(tweetText);
    await sleep(1000);

    if (imageUrl) {
      console.log('Preparing image for clipboard paste...');
      await copyImageUrlToClipboard(imageUrl);
      await sleep(1000);

      console.log('Pasting image into tweet...');
      await keyboard.pressKey(Key.LeftSuper, Key.V);
      await keyboard.releaseKey(Key.LeftSuper, Key.V);
      await sleep(8000);
    } else {
      console.log('No image URL provided, skipping image attachment');
    }

    console.log('✅ Tweet text pasted successfully!');
    if (imageUrl) {
      console.log('✅ Image pasted into tweet successfully!');
    }
    console.log('🎯 Waiting for the attachment to settle before posting...');
    await sleep(imageUrl ? 4000 : 0);

    await keyboard.pressKey(Key.LeftSuper, Key.Return);
    await keyboard.releaseKey(Key.LeftSuper, Key.Return);

    console.log('Tweet posted');

    await keyboard.pressKey(Key.LeftSuper, Key.L);
    await keyboard.releaseKey(Key.LeftSuper, Key.L);
    await sleep(500);

    console.log('Navigating back to the monitored page...');
    keyboard.config.autoDelayMs = 10;
    await keyboard.type(RETURN_URL);
    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    await sleep(2000);
    console.log('✅ Successfully navigated back to the monitored page');
  } catch (error) {
    console.error('Failed to open Twitter compose:', error.message);
    throw error;
  }
}

async function copyImageUrlToClipboard(imageUrl) {
  const downloadedImagePath = await downloadRemoteImage(imageUrl);
  const pngImagePath = await convertImageToPng(downloadedImagePath);
  await setClipboardImage(pngImagePath);

  await cleanupTempFile(downloadedImagePath);
  if (pngImagePath !== downloadedImagePath) {
    await cleanupTempFile(pngImagePath);
  }
}

async function downloadRemoteImage(imageUrl) {
  const urlObject = new URL(imageUrl);
  const tempFilePath = path.join(
    os.tmpdir(),
    `nftwatcher-${crypto.randomUUID()}${path.extname(urlObject.pathname) || '.img'}`
  );

  const data = await fetchBuffer(urlObject);
  await fs.writeFile(tempFilePath, data);
  return tempFilePath;
}

function fetchBuffer(urlObject) {
  const client = urlObject.protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const request = client.get(urlObject, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = new URL(response.headers.location, urlObject).toString();
        resolve(fetchBuffer(new URL(redirectUrl)));
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
        response.resume();
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', reject);
  });
}

async function convertImageToPng(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.png');

  if (path.extname(inputPath).toLowerCase() === '.png') {
    return inputPath;
  }

  await runCommand('sips', ['-s', 'format', 'png', inputPath, '--out', outputPath]);
  return outputPath;
}

async function setClipboardImage(imagePath) {
  const escapedPath = imagePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const script = `set the clipboard to (read (POSIX file "${escapedPath}") as picture)`;
  await runCommand('osascript', ['-e', script]);
}

async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore cleanup failures
  }
}

async function typeMultilineText(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    await keyboard.type(lines[i]);

    if (i < lines.length - 1) {
      await keyboard.pressKey(Key.Return);
      await keyboard.releaseKey(Key.Return);
      await sleep(200);
    }
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const details = stderr ? ` ${stderr.trim()}` : '';
        reject(new Error(`${command} failed.${details}`));
        return;
      }

      resolve(String(stdout || '').trim());
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  postTweet,
  openTwitterCompose
};
