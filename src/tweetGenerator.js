const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a tweet for an NFT sale using OpenAI
 * @param {Object} saleData - The sale data object
 * @param {string} nftUrl - The URL of the NFT
 * @returns {Promise<string>} - The generated tweet text
 */
async function generateTweet(saleData, nftUrl = '') {
  const { rarity, price, timestamp } = saleData;
  
  // Enhanced prompt that asks OpenAI to analyze the URL content
  const promptTemplate = `
    Please visit and analyze this NFT listing: ${nftUrl}
    
    Based on the content you find on that page, along with these details:
    - Collection: Apu Apustajas
    - Rarity: #${rarity}
    - Tell a joke about the Traits
    - Price: ${price} ${price !== 'N/A' ? 'ETH' : ''}
    - Time: Just now
    
    Create an epic engaging tweet as Dave Chappelle:
    - References specific trait details you found on the NFT page (traits)
    - Maintains an truly Dave Chappelle tone
    - Mentions the rarity number if rare
    - Keeps under 280 characters
    - DO NOT USE hashtags
    
    Generate a unique, engaging tweet that incorporates the actual NFT details you discovered as Dave Chappelle
  `;
  
  try {
    console.log('Generating tweet for sale:', saleData);
    console.log('NFT URL for analysis:', nftUrl);
    console.log('Asking OpenAI to analyze the NFT page...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for web browsing capability
      messages: [
        {
          role: "system",
          content: "You are a social media expert specializing in NFT sales announcements. You have the ability to browse and analyze web content. Create engaging, concise tweets that incorporate specific details from the NFT listing page to drive excitement and engagement."
        },
        {
          role: "user",
          content: promptTemplate
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });
    
    const tweet = completion.choices[0].message.content.trim();
    
    // Remove quotes if they wrap the entire tweet
    let cleanTweet = tweet;
    if ((cleanTweet.startsWith('"') && cleanTweet.endsWith('"')) || 
        (cleanTweet.startsWith("'") && cleanTweet.endsWith("'"))) {
      cleanTweet = cleanTweet.slice(1, -1);
    }
    
    console.log('Generated tweet with URL analysis:', cleanTweet);
    
    // Ensure tweet is under 280 characters
    if (cleanTweet.length > 280) {
      return cleanTweet.substring(0, 277) + '...';
    }
    
    return cleanTweet;
  } catch (error) {
    console.error('Failed to generate tweet with URL analysis:', error.message);
    console.log('Falling back to basic tweet generation...');
    
    // Fallback to basic prompt without URL analysis
    const basicPrompt = `
      Generate a short, engaging tweet about an NFT sale:
      - Collection: Apu Apustajas
      - Rarity: #${rarity}
      - Price: ${price} ${price !== 'N/A' ? 'ETH' : ''}
      
      Keep it under 280 characters with emojis and hashtags #NFT #ApuApustajas #OpenSea
    `;
    
    try {
      const fallbackCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a social media expert. Create engaging NFT sale tweets."
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
      const staticTweet = `🚨 APU #${rarity} just sold${price !== 'N/A' ? ` for ${price} ETH` : ''}! 🔥 #NFT #ApuApustajas #OpenSea ${nftUrl}`;
      console.log('Using static fallback tweet:', staticTweet);
      return staticTweet;
    }
  }
}

module.exports = {
  generateTweet
}; 