const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a tweet for an NFT sale using OpenAI
 * @param {Object} saleData - The sale data object
 * @returns {Promise<string>} - The generated tweet text
 */
async function generateTweet(saleData) {
  const { rarity, price, timestamp } = saleData;
  
  // In-code template for tweet generation
  const promptTemplate = `
    Generate a short, engaging tweet about an NFT sale with these details:
    - Collection: Apu Apustajas
    - Rarity: #${rarity}
    - Price: ${price} ${price !== 'N/A' ? 'ETH' : ''}
    - Time: Just now
    
    Brand voice guidelines:
    - Excited but professional tone
    - Include relevant emojis
    - Mention the rarity number prominently
    - Keep under 280 characters
    - Make it feel urgent/newsworthy
    - Use hashtags: #NFT #ApuApustajas #OpenSea
    
    Example format:
    "🚨 APU #${rarity} just sold${price !== 'N/A' ? ` for ${price} ETH` : ''}! 🔥 Another rare Apu finds a new home! 🏠 #NFT #ApuApustajas #OpenSea"
    
    Generate a unique, engaging tweet following this style:
  `;
  
  try {
    console.log('Generating tweet for sale:', saleData);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a social media expert specializing in NFT sales announcements. Create engaging, concise tweets that drive excitement."
        },
        {
          role: "user",
          content: promptTemplate
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });
    
    const tweet = completion.choices[0].message.content.trim();
    console.log('Generated tweet:', tweet);
    
    // Ensure tweet is under 280 characters
    if (tweet.length > 280) {
      return tweet.substring(0, 277) + '...';
    }
    
    return tweet;
  } catch (error) {
    console.error('Failed to generate tweet:', error.message);
    
    // Fallback tweet if OpenAI fails
    const fallbackTweet = `🚨 APU #${rarity} just sold${price !== 'N/A' ? ` for ${price} ETH` : ''}! 🔥 #NFT #ApuApustajas #OpenSea`;
    console.log('Using fallback tweet:', fallbackTweet);
    return fallbackTweet;
  }
}

module.exports = {
  generateTweet
}; 