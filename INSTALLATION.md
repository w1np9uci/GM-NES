# IndexedDB Viewer - Installation Guide

## Quick Start

### Step 1: Install Tampermonkey Browser Extension

1. Visit [tampermonkey.net](https://www.tampermonkey.net/)
2. Download for your browser:
   - **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobp55f)
   - **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - **Safari**: [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)
   - **Opera**: [Opera Add-ons](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)

3. Click "Add to Browser" or "Install"
4. Confirm the installation when prompted

### Step 2: Install the IndexedDB Viewer Script

#### Method A: Manual Copy-Paste (Recommended)

1. **Open Tampermonkey Dashboard**
   - Click the Tampermonkey icon in your browser toolbar
   - Click "Create a new script" or the dashboard icon (📋)

2. **Open the Script File**
   - Open `indexeddb-viewer.js` from this repository in your text editor
   - Select all content (Ctrl+A / Cmd+A)
   - Copy the entire script (Ctrl+C / Cmd+C)

3. **Paste into Tampermonkey**
   - In the Tampermonkey editor, select all existing text (Ctrl+A)
   - Delete it
   - Paste the copied script (Ctrl+V / Cmd+V)

4. **Save the Script**
   - Press Ctrl+S (or Cmd+S on Mac)
   - You should see a notification saying "Script updated"
   - Close the editor tab

#### Method B: Direct File Installation

If your browser supports it:

1. Drag and drop `indexeddb-viewer.js` onto the Tampermonkey dashboard
2. The script will be automatically imported
3. Click "Install" if prompted

### Step 3: Verify Installation

1. Navigate to any website (try Facebook, Gmail, or any site you know uses IndexedDB)
2. Look for the "📊 IndexedDB Viewer" panel in the bottom-right corner
3. Wait for the page to fully load
4. The panel should show "Loading databases..."
5. After a moment, you should see a list of databases if any exist on that site

## Troubleshooting Installation

### Problem: I don't see the Tampermonkey icon in the browser

**Solution**: The extension may not be visible in the toolbar by default.
- Chrome/Edge: Click the extension icon (puzzle piece), find Tampermonkey, click the pin icon
- Firefox: Click the menu (three lines), click "Extensions and themes", find Tampermonkey
- Safari: Extensions should appear in Safari menu

### Problem: Script doesn't appear in Tampermonkey dashboard

**Solution**:
1. Verify you copied the entire script (all 824 lines)
2. Check that the header section starts with `// ==UserScript==`
3. Check that the footer ends with `// ==/UserScript==`
4. Try creating a new script and copying again
5. Check the browser console (F12) for error messages

### Problem: Panel appears but databases aren't loading

**Solution**:
1. The website may not use IndexedDB (this is normal)
2. Check browser DevTools to verify: F12 → Application → IndexedDB
3. Wait a few seconds after the page loads for the panel to populate
4. Try clicking the refresh button (🔄) in the panel header
5. Check browser console for error messages

### Problem: The script is installed but not running

**Solution**:
1. Make sure Tampermonkey is enabled in your browser extensions
2. Check that the script status shows as "Enabled" in the Tampermonkey dashboard
3. The script only runs on pages with the `http://` or `https://` protocol
4. Try a full page refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Problem: Permission or security errors

**Solution**:
1. This is usually a browser sandbox restriction (expected behavior)
2. IndexedDB access is restricted to the same origin (security feature)
3. If you're on HTTPS, all accessed data must also be HTTPS
4. Some sites may block script injection - try a different site

## Updating the Script

To update to a newer version:

1. Download the latest `indexeddb-viewer.js` file
2. Open Tampermonkey Dashboard → Find "IndexedDB Viewer" script
3. Click the edit icon (pencil)
4. Select all (Ctrl+A) and delete
5. Copy the new script and paste it
6. Save (Ctrl+S)

## Uninstalling the Script

To remove the script:

1. Open Tampermonkey Dashboard
2. Find "IndexedDB Viewer" in the list
3. Click the trash icon (🗑️) to delete
4. Confirm deletion

The browser extension will continue to run but the script will be removed.

## Configuration

### Custom Database Names

If your target website uses custom IndexedDB database names not in the default list, you can modify the script:

1. Open the script in Tampermonkey editor
2. Find this line (around line 710):
   ```javascript
   const commonDbs = ['firebaseLocalStorageDb', 'firestore', 'localDB', 'appDb', 'cache'];
   ```
3. Add your custom database name to the array:
   ```javascript
   const commonDbs = ['firebaseLocalStorageDb', 'firestore', 'localDB', 'appDb', 'cache', 'myCustomDB'];
   ```
4. Save the script

After this change, the script will also check for and display your custom database.

### Adjusting Data Limit

To change how many items are displayed (default 1000):

1. Find this line (around line 122):
   ```javascript
   async getStoreData(dbName, storeName, limit = 1000) {
   ```
2. Change `1000` to your desired number (e.g., `5000` for more items)
3. Also find the call to this function (around line 673):
   ```javascript
   const data = await this.viewer.getStoreDataWithKeys(dbName, storeName, 1000);
   ```
4. Update this `1000` to match
5. Save the script

### Adjusting Panel Position

To move the panel from bottom-right to a different position, modify the CSS in the `createPanel` method:

- **Bottom-right** (default): `bottom: 20px; right: 20px;`
- **Bottom-left**: `bottom: 20px; right: auto; left: 20px;`
- **Top-right**: `top: 20px; bottom: auto; right: 20px;`
- **Top-left**: `top: 20px; bottom: auto; left: 20px;`

## Browser-Specific Notes

### Chrome/Chromium-based Browsers
- Most stable performance
- Supports all features
- Latest versions recommended

### Firefox
- Fully supported
- May have slightly different popup styling
- Requires Tampermonkey or Greasemonkey extension

### Safari
- Supported via Tampermonkey Safari extension
- Requires Safari 14+ or later
- Some advanced features may not work as smoothly

### Edge
- Chromium-based, same as Chrome
- Full support for all features

### Opera
- Based on Chromium
- Full support available
- May require enabling the script on first use

## Verifying Browser IndexedDB Support

To verify your browser supports IndexedDB, open the browser console and paste:

```javascript
console.log('IndexedDB available:', !!window.indexedDB);
console.log('indexedDB.databases() supported:', typeof indexedDB.databases === 'function');
```

Both should return `true` for full compatibility.

## Next Steps

After successful installation:

1. **Explore**: Visit websites and use the viewer to explore their IndexedDB
2. **Export**: Try exporting data from different stores
3. **Search**: Use the search feature to filter data
4. **Debug**: Use the viewer to debug storage issues during development

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console errors (F12 → Console tab)
3. Verify the website actually uses IndexedDB (F12 → Application → IndexedDB)
4. Check Tampermonkey documentation: https://www.tampermonkey.net/documentation.php
5. Try on a different website to rule out site-specific issues

## Advanced Usage

### Accessing from Console

You can access the viewer programmatically from the browser console:

```javascript
// The viewer instance is created globally when the script loads
// You can inspect it if needed for debugging
```

### Keyboard Navigation

- **Enter** in search box: Updates search results
- **Click** on database names: Expands/collapses tree
- **Click** on store names: Loads store data
- **Click** on "View": Opens detail modal

## Security Notes

- The script is **completely safe** - it only reads IndexedDB data, doesn't modify it
- All processing happens **locally in your browser** - no data is sent anywhere
- The script **respects same-origin policy** - can only access data from the current website
- **No tracking or analytics** - the script doesn't collect any information about your usage

## Performance Tips

- If the panel is slow, try searching for specific items instead of viewing all data
- Close the panel when not in use to free up browser memory
- Reload the page if the viewer becomes unresponsive
- Export large datasets to JSON file for offline analysis

## Version Information

Current version: 1.0.0

See [README.md](./README.md) for version history and feature list.
