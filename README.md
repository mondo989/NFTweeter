# NFT Sales Twitter Bot Specification

## Overview
A modular Node.js terminal application that uses Nut.js for UI automation, browser-side JavaScript for reading activity-row text, and local templates for tweet generation. It monitors a single OpenSea activity page and posts a tweet whenever the configured row text changes.

## File Structure
```
.
├── .env                       # Browser, selector, and timing config
├── .cursorrules               # Nut.js cursor/region rules
├── data/
│   └── lastSale.json          # Stores last seen rarity number
├── src/
│   ├── monitor.js             # Main loop and sale detection logic
│   ├── pageReader.js          # Reads browser DOM text with AppleScript
│   ├── extract.js             # Parses row text into sale fields
│   ├── tweetGenerator.js      # Local tweet templates and formatting
│   └── twitterBot.js          # Automates Brave/Twitter post
├── SPEC.md                    # This high-level spec
└── package.json               # Node >=16.0.0, dependencies
```

## Modules

- **Monitor**  
  Periodically reads the configured browser row text, compares it against the stored value in `lastSale.json`, and triggers the tweet flow when the rarity changes.

- **Page Reader**  
  Uses browser-side JavaScript via AppleScript to read the `innerText` from a configurable DOM row.

- **Extraction**  
  Converts the row text into structured fields (rarity, timestamp, price placeholder).

- **Tweet Generator**  
  Local template builder that turns sale details into a deterministic tweet.

- **Twitter Bot**  
  Activates Brave (logged-in session), opens Twitter compose window, pastes generated tweet, attaches the OpenSea image, and posts.

## Configuration

- `.env`  
  ```text
  BROWSER_APP=Brave Browser
  ACTIVITY_URL=https://opensea.io/collection/apuapustajas/activity?activityTypes=sale
  CHECK_INTERVAL_MS=60000
  ```
- `ACTIVITY_SNAPSHOT_JS` can override the built-in table selectors if needed.
- `tweetGenerator.js` contains the local copy used to format tweets.

## Runtime

1. `npm install`
2. Set `BROWSER_APP=Brave Browser` in `.env`
3. Set `ACTIVITY_URL` in `.env` to the OpenSea activity page you want to monitor
4. `node src/monitor.js`

Permissions (Accessibility and Automation) handled by user.


**Key Considerations**  
- Minimal dependencies: Node ≥16 and browser automation only.  
- User handles macOS Accessibility and Automation permissions.  
- Console-only logging for simplicity.  
- Runtime on a local machine; config edits swap target collections.  
- DOM text read failures trigger a retry on the next poll.  
- Nut.js remains for click and clipboard automation.  

---
