# NFT Sales Twitter Bot - Technical Specification

## Overview
This Node.js application monitors OpenSea NFT activity pages and automatically posts tweets when new sales are detected. It uses computer vision (Nut.js) for click and clipboard automation, browser-side JavaScript for text extraction, and local templates for generating tweet content.

## Architecture

### Core Components

1. **Monitor Module** (`src/monitor.js`)
   - Main entry point and orchestrator
   - Manages the monitoring loop with configurable intervals
   - Handles browser activation and sale detection
   - Coordinates all other modules

2. **Page Reader Module** (`src/pageReader.js`)
   - Executes browser-side JavaScript to read DOM text
   - Supports either a CSS selector or a custom JS expression
   - Uses AppleScript to query the front tab

3. **Extraction Module** (`src/extract.js`)
   - Parses browser row text into structured data
   - Extracts rarity numbers and prices
   - Extracts sold-from, sold-to, time label, and image URL
   - Validates changes against previous sales

4. **Tweet Generator** (`src/tweetGenerator.js`)
   - Uses local templates to generate engaging tweets
   - Implements brand voice through deterministic formatting
   - Keeps output predictable and dependency-light

5. **Twitter Bot** (`src/twitterBot.js`)
   - Automates browser-based tweet posting
   - Provides two methods: full automation and compose window
   - Uses clipboard for reliable text input and image attachment

## Data Flow

1. Activity page is open in the browser
2. Activates the browser and reads the configured row text
3. Browser-side JavaScript returns the row innerText
4. Extraction module parses rarity number
5. Compares with last known sale
6. If changed, generates tweet via the local template builder
7. Posts tweet through browser automation with the image attached
8. Updates last sale record

## Configuration

### Environment Variables (.env)
- `BROWSER_APP`: Browser to query, usually `Brave Browser`
- `ACTIVITY_URL`: OpenSea sale activity page to open before each check and return to after posting
- `ACTIVITY_SNAPSHOT_JS`: Optional custom browser expression that returns `rarityText`, `saleText`, and `imageUrl`
- `CHECK_INTERVAL_MS`: Polling interval (default: 60000)

### Browser Row Configuration
The monitored row text is read from the first activity row using built-in selectors, and `.env` can override that with `ACTIVITY_SNAPSHOT_JS`.

## Error Handling

- Browser text read failures surface on the next poll
- Tweet generation always uses the local template path
- All errors are logged but don't stop the monitoring loop
- Graceful shutdown on SIGINT (Ctrl+C)

## Security Considerations

- Requires macOS accessibility permissions
- Requires macOS Automation permissions for browser scripting
- Assumes pre-authenticated browser sessions
- No external AI API keys are required

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
