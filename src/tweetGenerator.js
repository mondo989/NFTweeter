const OpenAI = require('openai');
const { clipboard } = require('@nut-tree-fork/nut-js');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a tweet for an NFT sale using OpenAI Vision to analyze the NFT image
 * @param {Object} saleData - The sale data object
 * @param {string} nftUrl - The URL of the NFT
 * @param {Buffer} screenshotBuffer - The screenshot buffer of the NFT page
 * @returns {Promise<string>} - The generated tweet text
 */
async function generateTweet(saleData, nftUrl = '', screenshotBuffer = null) {
  const { rarity, price, timestamp } = saleData;
  
  try {
    console.log('Generating tweet for sale:', saleData);
    console.log('NFT URL:', nftUrl);
    
    if (!screenshotBuffer) {
      console.log('No screenshot provided, falling back to basic tweet...');
      throw new Error('No screenshot data provided');
    }
    
    console.log('Analyzing NFT screenshot with GPT-4 Vision...');
    console.log('Screenshot buffer length:', screenshotBuffer.length);
    
    // Convert buffer to base64 for OpenAI Vision API
    const base64Image = screenshotBuffer.toString('base64');
    console.log('Successfully converted screenshot to base64, length:', base64Image.length);
    
    const promptTemplate = `
      Analyze this NFT image and create an epic engaging tweet as Dave Chappelle about someone who purchased the NFT:
      
      NFT Details:
      - Collection: Apu Apustajas
      - Rarity: #${rarity}
      - Tell a joke about the Traits you can see in the image
      - Price: ${price} ${price !== 'N/A' ? 'ETH' : ''}
      - Time: Just now
      
      Requirements:
      - Look at the actual image and describe what you see (traits, colors, accessories, etc.)
      - Write in Dave Chappelle's comedic style which is very spicy/edgy/mean
      - Mention the rarity number if rare
      - Keep at 300 characters, finish your sentences.
      - DO NOT USE hashtags
      - NEVER MENTION PEPE THE FROG, These are Apu Apustaja
      - Never mention getting scammed or ripped off.
      - Use $apu or $Apu at least one time when mentioning the collection.
      - Make jokes about the visual traits you observe
      - Try and tell a short story about the character if possible when describing it.
      
      Generate a unique, engaging tweet based on what you actually see in this NFT image:
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Dave Chappelle creating hilarious tweets about NFT sales. You can see and analyze images to make specific jokes about what you observe. Never Use Hashtags! Respond in a way of saying 'A new fren bought an NFT'"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptTemplate
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 350,
      temperature: 0.8,
    });
    
    const tweet = completion.choices[0].message.content.trim();
    
    // Remove quotes if they wrap the entire tweet
    let cleanTweet = tweet;
    if ((cleanTweet.startsWith('"') && cleanTweet.endsWith('"')) || 
        (cleanTweet.startsWith("'") && cleanTweet.endsWith("'"))) {
      cleanTweet = cleanTweet.slice(1, -1);
    }
    
    console.log('Generated tweet with image analysis:', cleanTweet);
    
    // Ensure tweet is under 280 characters
    if (cleanTweet.length > 280) {
      return cleanTweet.substring(0, 277) + '...';
    }
    
    return cleanTweet;
    
  } catch (error) {
    console.error('Failed to generate tweet with image analysis:', error.message);
    console.log('Falling back to basic tweet generation...');
    
    // Fallback to basic prompt without image analysis
    const basicPrompt = `
      Generate a short, engaging tweet as Dave Chappelle about an NFT sale:
      - Collection: Apu Apustajas
      - Rarity: #${rarity}
      - Price: ${price} ${price !== 'N/A' ? 'ETH' : ''}
      
      Keep it under 280 characters, no hashtags, Dave Chappelle style
    `;
    
    try {
      const fallbackCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are Dave Chappelle creating funny tweets about NFT sales."
          },
          {
            role: "user",
            content: basicPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });
      
      const fallbackTweet = fallbackCompletion.choices[0].message.content.trim();
      
      // Remove quotes if they wrap the entire tweet
      let cleanFallbackTweet = fallbackTweet;
      if ((cleanFallbackTweet.startsWith('"') && cleanFallbackTweet.endsWith('"')) || 
          (cleanFallbackTweet.startsWith("'") && cleanFallbackTweet.endsWith("'"))) {
        cleanFallbackTweet = cleanFallbackTweet.slice(1, -1);
      }
      
      console.log('Generated fallback tweet:', cleanFallbackTweet);
      return cleanFallbackTweet.length > 280 ? cleanFallbackTweet.substring(0, 277) + '...' : cleanFallbackTweet;
      
    } catch (fallbackError) {
      console.error('Fallback tweet generation also failed:', fallbackError.message);
      
      // Final fallback - static tweet
      const staticTweet = `Yo, APU #${rarity} just sold${price !== 'N/A' ? ` for ${price} ETH` : ''}! Someone's wallet just got a new friend! 🐸`;
      console.log('Using static fallback tweet:', staticTweet);
      return staticTweet;
    }
  }
}

module.exports = {
  generateTweet
}; 