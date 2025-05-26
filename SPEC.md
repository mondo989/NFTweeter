# NFT Sales Twitter Bot - Technical Specification

## Overview
This Node.js application monitors OpenSea NFT collections for sales and automatically posts tweets when new sales are detected. It uses computer vision (Nut.js) for screen automation, OCR (Tesseract.js) for text extraction, and OpenAI for generating engaging tweet content.

## Architecture

### Core Components

1. **Monitor Module** (`src/monitor.js`)
   - Main entry point and orchestrator
   - Manages the monitoring loop with configurable intervals
   - Handles page refresh automation
   - Coordinates all other modules

2. **OCR Module** (`src/ocr.js`)
   - Wraps Tesseract.js for text extraction
   - Implements retry logic for reliability
   - Provides progress logging

3. **Extraction Module** (`src/extract.js`)
   - Parses OCR output into structured data
   - Extracts rarity numbers and prices
   - Validates changes against previous sales

4. **Tweet Generator** (`src/tweetGenerator.js`)
   - Uses OpenAI API to generate engaging tweets
   - Implements brand voice through prompt engineering
   - Includes fallback mechanism for API failures

5. **Twitter Bot** (`src/twitterBot.js`)
   - Automates browser-based tweet posting
   - Provides two methods: full automation and compose window
   - Uses clipboard for reliable text input

## Data Flow

1. Monitor refreshes OpenSea page
2. Captures screenshot of rarity region
3. OCR extracts text from screenshot
4. Extraction module parses rarity number
5. Compares with last known sale
6. If changed, generates tweet via OpenAI
7. Posts tweet through browser automation
8. Updates last sale record

## Configuration

### Environment Variables (.env)
- `OPENAI_API_KEY`: API key for tweet generation
- `OPENSEA_URL`: Target collection URL
- `CHECK_INTERVAL_MS`: Polling interval (default: 60000)

### Screen Region Configuration
The rarity region coordinates need to be configured in the monitor module based on your screen resolution and OpenSea's layout.

## Error Handling

- OCR failures trigger automatic retry
- OpenAI failures fall back to template tweets
- All errors are logged but don't stop the monitoring loop
- Graceful shutdown on SIGINT (Ctrl+C)

## Security Considerations

- Requires macOS accessibility permissions
- Requires screen recording permissions
- Assumes pre-authenticated browser sessions
- API keys stored in environment variables

## Performance

- Minimal resource usage between checks
- Asynchronous operations throughout
- Configurable polling interval to balance responsiveness and resource usage

## Future Enhancements

- Multiple collection monitoring
- Database storage for historical data
- Web dashboard for monitoring
- Direct Twitter API integration
- Docker containerization 