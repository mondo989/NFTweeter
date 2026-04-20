/**
 * Extracts sale data from the browser snapshot
 * @param {Object|string} snapshot - The raw browser snapshot or row text
 * @returns {Object} - Structured sale data with rarity, timestamp, and price
 */
function extractSaleData(snapshot) {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  console.log('Extracting sale data from snapshot:', normalizedSnapshot);

  const rarityNumber = extractRarityNumber(normalizedSnapshot.rarityText || normalizedSnapshot.rawText || normalizedSnapshot.saleText);
  const saleDetails = extractSaleDetails(normalizedSnapshot.rawText || normalizedSnapshot.saleText);
  const imageUrl = normalizeImageUrl(normalizedSnapshot.imageUrl);
  const saleUrl = String(normalizedSnapshot.saleUrl || '').trim();
  const saleId = extractSaleItemId(saleUrl);

  const saleData = {
    rarity: rarityNumber,
    timestamp: new Date().toISOString(),
    price: saleDetails.price ?? 'N/A',
    soldFrom: saleDetails.soldFrom || 'N/A',
    soldTo: saleDetails.soldTo || 'N/A',
    timeLabel: saleDetails.timeLabel || 'N/A',
    imageUrl,
    saleUrl,
    saleId,
    rarityText: normalizedSnapshot.rarityText || '',
    saleText: normalizedSnapshot.saleText || '',
    rawText: normalizedSnapshot.rawText || normalizedSnapshot.saleText || normalizedSnapshot.rarityText || ''
  };

  console.log('Extracted sale data:', saleData);
  return saleData;
}

function normalizeSnapshot(snapshot) {
  if (typeof snapshot === 'string') {
    return {
      rarityText: snapshot,
      saleText: '',
      rawText: snapshot,
      saleUrl: '',
      imageUrl: ''
    };
  }

  return {
    rarityText: snapshot?.rarityText || '',
    saleText: snapshot?.saleText || '',
    rawText: snapshot?.rawText || '',
    saleUrl: snapshot?.saleUrl || '',
    imageUrl: snapshot?.imageUrl || ''
  };
}

function extractRarityNumber(text) {
  const normalizedText = String(text || '').trim();

  const rarityMatch =
    normalizedText.match(/#\s*([\d,]+)/) ||
    normalizedText.match(/^\s*([\d,]+)\s*$/) ||
    normalizedText.match(/\b([\d,]+)\b/);

  if (!rarityMatch) {
    console.warn('Could not find a rarity number in the text');
    return null;
  }

  const numberString = rarityMatch[1].replace(/,/g, '');
  const rarityNumber = parseInt(numberString, 10);
  console.log(`Found rarity number: ${rarityMatch[1]} -> ${rarityNumber}`);
  return Number.isFinite(rarityNumber) ? rarityNumber : null;
}

function extractSaleDetails(saleText) {
  const text = String(saleText || '').trim();

  if (!text) {
    return {
      price: null,
      soldFrom: null,
      soldTo: null,
      timeLabel: null
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const rarityLineIndex = lines.findIndex(isRarityLine);
  const raritySectionIndex = rarityLineIndex >= 0 ? rarityLineIndex : lines.length;

  const price = extractPrice(lines, raritySectionIndex);

  const postRarityLines = raritySectionIndex >= 0
    ? lines.slice(raritySectionIndex + 1)
    : [];

  const dataLines = postRarityLines.filter(line => !isTimeLabel(line) && !isCountLine(line));

  const soldFrom = dataLines[0] || null;
  const soldTo = dataLines[1] || null;
  const timeLabel = postRarityLines.find(isTimeLabel) || dataLines[2] || null;

  return {
    price,
    soldFrom,
    soldTo,
    timeLabel
  };
}

function isRarityLine(line) {
  return /^#\s*[\d,]+$/.test(String(line || '').trim());
}

function isCountLine(line) {
  return /^\d+$/.test(String(line || '').trim());
}

function isTimeLabel(line) {
  return /\b(?:ago|m|h|d|w)\b/i.test(String(line || '').trim());
}

function extractPrice(lines, raritySectionIndex) {
  for (let i = 0; i < raritySectionIndex; i += 1) {
    const current = String(lines[i] || '').trim();
    const next = String(lines[i + 1] || '').trim().toUpperCase();

    if (/^\d+\.?\d*$/.test(current) && /^(ETH|WETH|USD|USDC)$/i.test(next)) {
      const numericPrice = parseFloat(current);
      if (Number.isFinite(numericPrice)) {
        return numericPrice;
      }
    }
  }

  const fallbackMatch = lines.join(' ').match(/(\d+\.?\d*)\s*(?:ETH|WETH|USD|USDC)\b/i);
  if (fallbackMatch) {
    const numericPrice = parseFloat(fallbackMatch[1]);
    return Number.isFinite(numericPrice) ? numericPrice : null;
  }

  return null;
}

function normalizeImageUrl(imageUrl) {
  const rawUrl = String(imageUrl || '').trim();

  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);
    parsed.search = '';
    return parsed.toString();
  } catch (error) {
    return rawUrl.split('?')[0];
  }
}

function extractSaleItemId(saleUrl) {
  const text = String(saleUrl || '').trim();

  if (!text) {
    return null;
  }

  const match = text.match(/\/item\/[^/]+\/[^/]+\/(\d+)(?:[/?#]|$)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  const fallback = text.match(/\/(\d+)(?:[/?#]|$)/);
  if (fallback) {
    return parseInt(fallback[1], 10);
  }

  return null;
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
  extractRarityNumber,
  hasRarityChanged,
  normalizeImageUrl,
  extractSaleItemId
};
