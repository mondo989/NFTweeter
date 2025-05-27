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
    await sleep(1000);
    
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
 * Alternative method: Opens Twitter compose and pastes image
 * @param {string} tweetText - The text to tweet
 * @returns {Promise<void>}
 */
async function openTwitterCompose(tweetText) {
  try {
    console.log('Opening Twitter compose window...');
    console.log('Tweet text to post:', tweetText);
    
    const twitterUrl = `https://twitter.com/`;
    
    // Open URL in default browser
    exec(`open "${twitterUrl}"`, (error) => {
      if (error) {
        console.error('Failed to open Twitter compose:', error);
        throw error;
      }
      console.log('Twitter compose window opened in browser');
    });
    
    // Wait for the page to load completely
    await sleep(5000);

    // Press 'N' to open new tweet compose
    await keyboard.pressKey(Key.N);
    await keyboard.releaseKey(Key.N);
    await sleep(1000); // Wait for compose window to open
    
    // Paste the OpenAI-generated tweet text first
    console.log('Typing tweet text...');
    await keyboard.type(tweetText);
    await sleep(1000);
    
    // Add a space and then paste the image
    console.log('Adding space and pasting image...');
    await keyboard.type(' '); // Add space between text and image
    await sleep(300);
    
    // Paste the copied image (Cmd+V) - this preserves the image in clipboard
    console.log('Pasting copied image into tweet...');
    await keyboard.pressKey(Key.LeftSuper, Key.V);
    await keyboard.releaseKey(Key.LeftSuper, Key.V);
    await sleep(2000); // Wait for image to upload
    
    console.log('✅ Tweet text pasted successfully!');
    console.log('✅ Image pasted into tweet successfully!');
    console.log('🎯 Tweet is ready - you can review and post manually');

    await keyboard.pressKey(Key.LeftSuper, Key.Return);
    await keyboard.releaseKey(Key.LeftSuper, Key.Return);

    console.log("tweet posted Jeet!")
    
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