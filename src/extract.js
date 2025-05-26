/**
 * Extracts the rarity number from OCR text
 * @param {string} ocrText - The raw OCR text
 * @returns {Object} - Structured sale data with rarity, timestamp, and price
 */
function extractSaleData(ocrText) {
  console.log('Extracting sale data from OCR text:', ocrText);
  
  // Extract rarity number - specifically looking for patterns like "#2,093" or "#1234"
  // This regex looks for # followed by digits with optional commas
  const rarityMatch = ocrText.match(/#([\d,]+)/);
  let rarityNumber = null;
  
  if (rarityMatch) {
    // Remove commas and convert to integer
    const numberString = rarityMatch[1].replace(/,/g, '');
    rarityNumber = parseInt(numberString, 10);
    console.log(`Found rarity number: #${rarityMatch[1]} -> ${rarityNumber}`);
  } else {
    console.warn('Could not find rarity number starting with # in OCR text');
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