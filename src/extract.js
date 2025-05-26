/**
 * Extracts the rarity number from OCR text
 * @param {string} ocrText - The raw OCR text
 * @returns {Object} - Structured sale data with rarity, timestamp, and price
 */
function extractSaleData(ocrText) {
  console.log('Extracting sale data from OCR text:', ocrText);
  
  // Extract rarity number - looking for patterns like "#1234" or just "1234"
  const rarityMatch = ocrText.match(/#?(\d+)/);
  const rarityNumber = rarityMatch ? parseInt(rarityMatch[1], 10) : null;
  
  if (!rarityNumber) {
    console.warn('Could not extract rarity number from OCR text');
  }
  
  // Extract price if available (looking for ETH values)
  const priceMatch = ocrText.match(/(\d+\.?\d*)\s*ETH/i);
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;
  
  const saleData = {
    rarity: rarityNumber,
    timestamp: new Date().toISOString(),
    price: price || 'N/A',
    rawText: ocrText
  };
  
  console.log('Extracted sale data:', saleData);
  return saleData;
}

/**
 * Validates if the extracted rarity number is different from the last seen
 * @param {number} newRarity - The newly extracted rarity number
 * @param {number} lastRarity - The last seen rarity number
 * @returns {boolean} - True if the rarity has changed
 */
function hasRarityChanged(newRarity, lastRarity) {
  if (newRarity === null || newRarity === undefined) {
    return false;
  }
  
  if (lastRarity === null || lastRarity === undefined) {
    return true;
  }
  
  return newRarity !== lastRarity;
}

module.exports = {
  extractSaleData,
  hasRarityChanged
}; 