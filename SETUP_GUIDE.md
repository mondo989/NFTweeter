# NFT Sales Twitter Bot - Setup Guide

## Prerequisites

1. **Node.js**: Version 16.0.0 or higher
2. **macOS**: This bot is designed for macOS due to the automation requirements
3. **Twitter Account**: Must be logged in via Brave

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

Edit `.env` and add your collection and timing settings:
```
BROWSER_APP=Brave Browser
ACTIVITY_URL=https://opensea.io/collection/apuapustajas/activity?activityTypes=sale
CHECK_INTERVAL_MS=60000
```

### 4. Grant Required Permissions (IMPORTANT!)

The bot needs special permissions on macOS:

1. **Open System Preferences** → **Security & Privacy** → **Privacy**
2. Click the lock icon to make changes
3. Add Terminal (or your terminal app) to:
   - **Accessibility** (required for keyboard automation)
   - **Automation** (required for browser scripting)

### 5. Test Browser Text Read

Before running the full bot, test the browser text read:

```bash
npm run test-page-read
```

This will:
- Activate the browser
- Read the activity snapshot from the front tab
- Print the snapshot to the terminal
- Show you whether the rarity text, sale text, and image URL are returning correctly

### 6. Configure the Snapshot

1. The bot already reads the built-in selectors for the first activity row
2. If the layout changes, set `ACTIVITY_SNAPSHOT_JS` in `.env` to override the built-in selectors
3. Make sure the browser is still on the activity page when the bot starts

### 7. Prepare Browser

1. Make sure you're logged into Twitter in Brave
2. Open the OpenSea activity page in the browser before starting the bot
3. Keep the browser tab visible so AppleScript can read the front document

## Running the Bot

### Start the Monitor

```bash
npm start
```

The bot will:
1. Show a startup message with instructions
2. Activate the browser
3. Begin monitoring the page every 60 seconds
4. Read the configured activity snapshot from the front tab
5. Compare the rarity number against the last saved value
6. Post a tweet with the image attached when a new sale is detected

### Stop the Bot

Press `Ctrl+C` to stop the bot gracefully.

## Debugging Features

### Browser Text Read
- Use `npm run test-page-read` to verify the snapshot or custom JS
- The command prints the row text, sale text, and image URL being monitored
- This is the quickest way to confirm that the DOM selectors are reading correctly and that the image URL is clean

## Troubleshooting

### "Browser text read failed"
- Make sure you've granted Automation permission to Terminal
- Check that the browser is open on the activity page
- Confirm that `ACTIVITY_SNAPSHOT_JS` is set correctly if you overrode the defaults

### "Failed to open Brave"
- Make sure you've granted Accessibility permission to Terminal
- Ensure Brave can be launched via Spotlight search

## Testing Individual Components

### Test Browser Text Read Only
```bash
npm run test-page-read
```

### Test Selector or JS in Browser
```javascript
const { readActivitySnapshot } = require('./src/pageReader');
readActivitySnapshot().then(snapshot => {
  console.log('Browser snapshot:', snapshot);
});
```

## Customization

### Change Collection
Open the collection or activity page you want to monitor in your browser.

### Adjust Check Interval
Change `CHECK_INTERVAL_MS` in `.env` (value in milliseconds).

### Modify Tweet Style
Edit the local template logic in `src/tweetGenerator.js`.

### Adjust Monitored Row
Update `ACTIVITY_SNAPSHOT_JS` in `.env` if the row layout changes.

## Security Notes

- Never commit your `.env` file
- The bot assumes you're already logged into Twitter
- No passwords are stored or transmitted
- Browser text is read locally and not transmitted anywhere

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all permissions are granted
3. Use `npm run test-page-read` to debug selector issues
4. Confirm the browser is open on the correct activity page
5. Double-check the selector or custom JS in `.env`
