/**
 * Generates a tweet for an NFT sale using local templates.
 * @param {Object} saleData - The sale data object
 * @returns {Promise<string>} - The generated tweet text
 */
async function generateTweet(saleData) {
  const { rarity, saleId, price, soldFrom, soldTo, imageUrl } = saleData;
  console.log('Generating tweet locally for sale:', saleData);
  console.log('Image URL:', imageUrl || 'N/A');

  const itemText = formatItem(saleId, rarity);
  const priceText = formatPrice(price);
  const tradeText = formatTrade(soldFrom, soldTo);

  const tweet = `🚨 New Sale 🚨\n\n${itemText} was sold for ${priceText}.\n\n${tradeText}`;
  const cleanedTweet = normalizeTweet(tweet);

  console.log('Generated local tweet:', cleanedTweet);
  return cleanedTweet;
}

function formatItem(saleId, rarity) {
  if (saleId !== null && saleId !== undefined && saleId !== 'N/A') {
    return `Apu #${Number(saleId)}`;
  }

  if (rarity === null || rarity === undefined) {
    return 'Apu #unknown';
  }

  return `Apu #${Number(rarity)}`;
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 'N/A') {
    return 'an undisclosed price';
  }

  return `${price} ETH`;
}

function formatTrade(soldFrom, soldTo) {
  const fromText = cleanField(soldFrom);
  const toText = cleanField(soldTo);

  if (fromText && toText) {
    return `Sold from ${fromText} to ${toText}.`;
  }

  if (fromText) {
    return `Sold from ${fromText}.`;
  }

  if (toText) {
    return `Sold to ${toText}.`;
  }

  return 'Clean transfer.';
}

function cleanField(value) {
  const text = String(value || '').trim();
  if (!text || text === 'N/A') {
    return '';
  }

  return text;
}

function normalizeTweet(tweet) {
  const lines = String(tweet || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trimEnd());

  let cleanTweet = lines.join('\n').trim();

  if ((cleanTweet.startsWith('"') && cleanTweet.endsWith('"')) ||
      (cleanTweet.startsWith("'") && cleanTweet.endsWith("'"))) {
    cleanTweet = cleanTweet.slice(1, -1);
  }

  if (cleanTweet.length > 280) {
    return cleanTweet.substring(0, 277).trimEnd() + '...';
  }

  return cleanTweet;
}

module.exports = {
  generateTweet
};
