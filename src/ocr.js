const Tesseract = require('tesseract.js');

/**
 * Performs OCR on an image buffer to extract text
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<string>} - The extracted text
 */
async function extractText(imageBuffer) {
  try {
    console.log('Starting OCR processing...');
    
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: m => console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
      }
    );
    
    console.log('OCR completed successfully');
    return text.trim();
  } catch (error) {
    console.error('OCR failed:', error.message);
    throw error;
  }
}

/**
 * Performs OCR with retry logic
 * @param {Buffer} imageBuffer - The image buffer to process
 * @param {number} maxRetries - Maximum number of retry attempts (default: 1)
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextWithRetry(imageBuffer, maxRetries = 1) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying OCR (attempt ${attempt + 1})...`);
      }
      
      const text = await extractText(imageBuffer);
      return text;
    } catch (error) {
      lastError = error;
      console.error(`OCR attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  extractText,
  extractTextWithRetry
}; 