const { keyboard, Key, clipboard } = require('@nut-tree-fork/nut-js');
const { exec } = require('child_process');

/**
 * Posts a tweet using Safari automation
 * Assumes user is already logged into Twitter in Safari
 * @param {string} tweetText - The text to tweet
 * @returns {Promise<void>}
 */
async function postTweet(tweetText) {
  try {
    console.log('Starting Twitter post automation...');
    
    // Copy tweet text to clipboard
    await clipboard.copy(tweetText);
    console.log('Tweet text copied to clipboard');
    
    // Open Safari (Command + Space, then type Safari)
    await keyboard.type(Key.Cmd, Key.Space);
    await sleep(500);
    await keyboard.type('Safari');
    await keyboard.type(Key.Return);
    await sleep(2000);
    
    // Open new tab and navigate to Twitter
    await keyboard.type(Key.Cmd, Key.T);
    await sleep(500);
    await keyboard.type('twitter.com/compose/tweet');
    await keyboard.type(Key.Return);
    await sleep(3000); // Wait for page to load
    
    // Paste the tweet text
    await keyboard.type(Key.Cmd, Key.V);
    await sleep(500);
    
    // Post the tweet (Command + Enter)
    await keyboard.type(Key.Cmd, Key.Return);
    await sleep(1000);
    
    console.log('Tweet posted successfully!');
    
    // Close the tab
    await keyboard.type(Key.Cmd, Key.W);
    
  } catch (error) {
    console.error('Failed to post tweet:', error.message);
    throw error;
  }
}

/**
 * Alternative method: Opens Twitter compose in default browser
 * @param {string} tweetText - The text to tweet
 * @returns {Promise<void>}
 */
async function openTwitterCompose(tweetText) {
  try {
    console.log('Opening Twitter compose window...');
    
    // URL encode the tweet text
    const encodedTweet = encodeURIComponent(tweetText);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTweet}`;
    
    // Open URL in default browser
    exec(`open "${twitterUrl}"`, (error) => {
      if (error) {
        console.error('Failed to open Twitter compose:', error);
        throw error;
      }
      console.log('Twitter compose window opened in browser');
    });
    
  } catch (error) {
    console.error('Failed to open Twitter compose:', error.message);
    throw error;
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

module.exports = {
  postTweet,
  openTwitterCompose
}; 