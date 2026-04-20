const { execFile } = require('child_process');
require('dotenv').config();

const DEFAULT_BROWSER_APP = 'Brave Browser';

function resolveBrowserApp(browserApp = process.env.BROWSER_APP || DEFAULT_BROWSER_APP) {
  const normalized = String(browserApp || '').trim().toLowerCase();

  if (normalized === 'chrome' || normalized === 'google chrome') {
    return 'Google Chrome';
  }

  if (normalized === 'brave' || normalized === 'brave browser') {
    return 'Brave Browser';
  }

  if (normalized === 'safari') {
    return 'Safari';
  }

  return String(browserApp || DEFAULT_BROWSER_APP).trim();
}

function escapeAppleScriptString(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const details = stderr ? ` ${stderr.trim()}` : '';
        reject(new Error(`AppleScript failed.${details}`));
        return;
      }

      resolve(String(stdout || '').trim());
    });
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const details = stderr ? ` ${stderr.trim()}` : '';
        reject(new Error(`${command} failed.${details}`));
        return;
      }

      resolve(String(stdout || '').trim());
    });
  });
}

function buildRarityTextScript() {
  const customScript = process.env.RARITY_TEXT_JS && process.env.RARITY_TEXT_JS.trim();
  if (customScript) {
    return customScript;
  }

  const selector = process.env.RARITY_TEXT_SELECTOR && process.env.RARITY_TEXT_SELECTOR.trim();
  if (!selector) {
    throw new Error('Set RARITY_TEXT_SELECTOR or RARITY_TEXT_JS in .env');
  }

  return `(() => {
    const row = document.querySelector(${JSON.stringify(selector)});
    return row ? row.innerText.trim() : '';
  })();`;
}

function buildActivitySnapshotScript() {
  const customScript = process.env.ACTIVITY_SNAPSHOT_JS && process.env.ACTIVITY_SNAPSHOT_JS.trim();
  if (customScript) {
    return customScript;
  }

  return `(() => {
    const rarityText = document.querySelector('[role="table"] div:nth-child(1) > div > div > div:nth-child(5) > span')?.innerText?.trim() || '';
    const saleText = document.querySelector('[role="table"] div:nth-child(1) > div > div > div:nth-child(1)')?.innerText?.trim() || '';
    const imageSrc = document.querySelector('[role="table"] div:nth-child(1) > img')?.src || '';
    const saleUrl = document.querySelector('[role="table"] div:nth-child(1) > a')?.href || '';
    const imageUrl = imageSrc ? imageSrc.split('?')[0] : '';

    return JSON.stringify({
      rarityText,
      saleText,
      rawText: saleText,
      saleUrl,
      imageUrl
    });
  })();`;
}

async function activateBrowser(
  browserApp = process.env.BROWSER_APP || DEFAULT_BROWSER_APP,
  url = process.env.ACTIVITY_URL || process.env.MONITOR_URL || ''
) {
  const app = resolveBrowserApp(browserApp);
  if (url) {
    await runCommand('open', ['-a', app, url]);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await runAppleScript(`
    tell application "${app}"
      activate
      if (count of windows) is 0 then
        reopen
        delay 0.5
      end if
      activate
    end tell
  `);
}

async function ensureBrowserWindow(browserApp = process.env.BROWSER_APP || DEFAULT_BROWSER_APP) {
  const app = resolveBrowserApp(browserApp);
  await runAppleScript(`
    tell application "${app}"
      if (count of windows) is 0 then
        reopen
        delay 0.5
      end if
      activate
    end tell
  `);
}

async function readPageText(browserApp = process.env.BROWSER_APP || DEFAULT_BROWSER_APP) {
  const app = resolveBrowserApp(browserApp);
  await ensureBrowserWindow(app);
  const jsCode = buildRarityTextScript();
  const escapedJsCode = escapeAppleScriptString(jsCode);

  const script = app === 'Safari'
    ? `tell application "Safari" to do JavaScript "${escapedJsCode}" in front document`
    : `tell application "${app}" to tell active tab of front window to execute javascript "${escapedJsCode}"`;

  const output = await runAppleScript(script);
  return output.trim();
}

async function readActivitySnapshot(browserApp = process.env.BROWSER_APP || DEFAULT_BROWSER_APP) {
  const app = resolveBrowserApp(browserApp);
  await ensureBrowserWindow(app);
  const jsCode = buildActivitySnapshotScript();
  const escapedJsCode = escapeAppleScriptString(jsCode);

  const script = app === 'Safari'
    ? `tell application "Safari" to do JavaScript "${escapedJsCode}" in front document`
    : `tell application "${app}" to tell active tab of front window to execute javascript "${escapedJsCode}"`;

  const output = await runAppleScript(script);

  if (!output) {
    return {
      rarityText: '',
      saleText: '',
      imageUrl: ''
    };
  }

  try {
    const parsed = JSON.parse(output);
    return {
      rarityText: String(parsed.rarityText || '').trim(),
      saleText: String(parsed.saleText || '').trim(),
      rawText: String(parsed.rawText || parsed.saleText || '').trim(),
      saleUrl: String(parsed.saleUrl || '').trim(),
      imageUrl: String(parsed.imageUrl || '').trim()
    };
  } catch (error) {
    return {
      rarityText: output.trim(),
      saleText: '',
      rawText: '',
      saleUrl: '',
      imageUrl: ''
    };
  }
}

module.exports = {
  activateBrowser,
  ensureBrowserWindow,
  buildActivitySnapshotScript,
  buildRarityTextScript,
  readActivitySnapshot,
  readPageText,
  resolveBrowserApp
};
