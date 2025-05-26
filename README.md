# NFT Sales Twitter Bot Specification

## Overview
A modular Node.js terminal application that uses Nut.js for UI automation, Tesseract.js for OCR, and the OpenAI API for tweet generation. Monitors a single OpenSea collection page for changes in the top “rarity number” and posts a tweet whenever it changes.

## File Structure
```
.
├── .env                       # OpenAI key & config
├── .cursorrules               # Nut.js cursor/region rules
├── data/
│   └── lastSale.json          # Stores last seen rarity number
├── logs/                      # Console output archived if needed
├── src/
│   ├── monitor.js             # Automates page refresh & region capture
│   ├── ocr.js                 # Wraps Tesseract.js calls
│   ├── extract.js             # Parses OCR results into sale fields
│   ├── tweetGenerator.js      # In-code OpenAI prompt template
│   └── twitterBot.js          # Automates Safari/Twitter post
├── SPEC.md                    # This high-level spec
└── package.json               # Node >=16.0.0, dependencies
```

## Modules

- **Monitor**  
  Periodically (1 min) navigates to `OPENSEA_URL`, captures the “rarity” region via Nut.js, and compares against stored value in `lastSale.json`.

- **OCR**  
  Runs Tesseract.js on the captured region to extract the numeric rarity. Retries once on failure, logs errors to console.

- **Extraction**  
  Converts raw OCR output into structured fields (rarity, timestamp, price placeholder).

- **Tweet Generator**  
  In-code template string for OpenAI prompt; injects sale details and brand voice variables from `.env`.

- **Twitter Bot**  
  Activates Safari (logged-in session), opens Twitter compose window, pastes generated tweet, and posts.

## Configuration

- `.env`  
  ```text
  OPENAI_API_KEY=…
  OPENSEA_URL=https://opensea.io/collection/apuapustajas
  CHECK_INTERVAL_MS=60000
  ```
- In-code template in `tweetGenerator.js` for voice/style overrides.

## Runtime

1. `npm install`
2. `node src/monitor.js`

Permissions (Screen Recording, Accessibility) handled by user.


**Key Considerations**  
- Minimal dependencies: Node ≥16, Express only for health checks if ever needed.  
- User handles macOS accessibility and screen-recording permissions.  
- Console-only logging for simplicity.  
- Runtime on a local machine; config edits swap target collections.  
- OCR failures trigger a single retry, then delay until next poll.  
- Nut.js cursor rules configured in `.cursorrules` for robust region targeting.  

---