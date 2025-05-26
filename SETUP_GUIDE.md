# NFT Sales Twitter Bot - Setup Guide

## Prerequisites

1. **Node.js**: Version 16.0.0 or higher
2. **macOS**: This bot is designed for macOS due to the automation requirements
3. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/)
4. **Twitter Account**: Must be logged in via Safari

## Installation Steps

### 1. Clone/Download the Project

```bash
cd /Users/m/projects/current/nftwatcher
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENSEA_URL=https://opensea.io/collection/apuapustajas
CHECK_INTERVAL_MS=60000
```

### 4. Grant Required Permissions (IMPORTANT!)

The bot needs special permissions on macOS:

1. **Open System Preferences** → **Security & Privacy** → **Privacy**
2. Click the lock icon to make changes
3. Add Terminal (or your terminal app) to:
   - **Accessibility** (required for keyboard automation)
   - **Screen Recording** (required for screenshot capture)

### 5. Test Screenshot Capture

Before running the full bot, test the screenshot functionality:

```bash
npm run test-capture
```

This will:
- Automatically open Safari and navigate to your collection
- Capture a screenshot of the current rarity region
- Save it as `test-capture.png` in the project root
- Show you the current coordinates being used

### 6. Configure Screen Region

1. Open the `test-capture.png` file that was created
2. Check if the rarity number is visible in the captured area
3. If not, you need to adjust the coordinates in `src/monitor.js`:

```javascript
const RARITY_REGION = {
  x: 850,      // Adjust based on your screen
  y: 400,      // Adjust based on your screen
  width: 200,  // Width to capture
  height: 60   // Height to capture
};
```

4. Run `npm run test-capture` again to verify the new coordinates
5. Repeat until the rarity number is clearly visible in the screenshot

### 7. Prepare Browser

1. Make sure you're logged into Twitter in Safari
2. The bot will automatically handle opening Safari and navigating to the collection

## Running the Bot

### Start the Monitor

```bash
npm start
```

The bot will:
1. Show a startup message with instructions
2. Automatically open Safari and navigate to the collection page
3. Begin monitoring the page every 60 seconds
4. Refresh the page automatically
5. Capture and analyze the rarity region
6. Save screenshots to `screenshots/` directory for debugging
7. Post a tweet when a new sale is detected

### Stop the Bot

Press `Ctrl+C` to stop the bot gracefully.

## Debugging Features

### Screenshot Storage
- All screenshots are automatically saved to the `screenshots/` directory
- Each screenshot is timestamped for easy tracking
- Use these to verify the bot is capturing the correct region

### Test Capture
- Use `npm run test-capture` to test screenshot functionality
- This helps you find the correct coordinates without running the full bot

## Troubleshooting

### "Screen capture failed"
- Make sure you've granted Screen Recording permission
- Check that the RARITY_REGION coordinates are correct
- Run `npm run test-capture` to debug

### "OCR returned no text"
- The capture region might be off - adjust coordinates
- Check the saved screenshots in `screenshots/` directory
- The page might not be fully loaded - increase refresh delay

### "Failed to refresh page" or "Failed to open Safari"
- Make sure you've granted Accessibility permission to Terminal
- Ensure Safari can be launched via Spotlight search

### "OpenAI API error"
- Check your API key in `.env`
- Ensure you have API credits available

## Testing Individual Components

### Test Screen Capture Only
```bash
npm run test-capture
```

### Test OCR on Existing Screenshot
```javascript
const { extractText } = require('./src/ocr');
const fs = require('fs');
const buffer = fs.readFileSync('test-capture.png');
extractText(buffer).then(text => {
  console.log('OCR Result:', text);
});
```

## Customization

### Change Collection
Update `OPENSEA_URL` in `.env` to monitor a different collection.

### Adjust Check Interval
Change `CHECK_INTERVAL_MS` in `.env` (value in milliseconds).

### Modify Tweet Style
Edit the prompt template in `src/tweetGenerator.js`.

### Adjust Screenshot Region
Modify the `RARITY_REGION` object in `src/monitor.js` based on your screen resolution and the OpenSea layout.

## Security Notes

- Never commit your `.env` file
- Keep your OpenAI API key secure
- The bot assumes you're already logged into Twitter
- No passwords are stored or transmitted
- Screenshots are saved locally and not transmitted anywhere

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all permissions are granted
3. Use `npm run test-capture` to debug screenshot issues
4. Check saved screenshots in the `screenshots/` directory
5. Ensure coordinates match your screen setup 