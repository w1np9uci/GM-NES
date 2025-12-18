# IndexedDB Viewer - Usage Guide

## Quick Reference

| Feature | How to Use |
|---------|-----------|
| **Open Viewer** | Look for "📊 IndexedDB Viewer" panel in bottom-right corner |
| **Explore Database** | Click on database name to expand and see object stores |
| **View Store Data** | Click on an object store name to load its data |
| **Search Data** | Type in the search box to filter by key or value |
| **See Details** | Click "View" button on any table row to see full JSON |
| **Export Data** | Click "Export Store" to download the current store as JSON |
| **Move Panel** | Click and drag the header to move the panel anywhere |
| **Hide Panel** | Click "−" to collapse or "✕" to hide |
| **Refresh** | Click "🔄" to reload all databases |

## Getting Started in 30 Seconds

1. **Install Script**: Copy `indexeddb-viewer.js` into Tampermonkey (see [INSTALLATION.md](./INSTALLATION.md))
2. **Visit a Website**: Go to any website (try Gmail, Facebook, Trello, etc.)
3. **Find the Panel**: Look for "📊 IndexedDB Viewer" in bottom-right corner
4. **Explore**: Click on databases and stores to explore data
5. **Export**: Use "Export Store" to download data as JSON

## Main Interface Guide

### The Panel Layout

```
┌─────────────────────────────────────┐
│ 📊 IndexedDB Viewer  [🔄] [−] [✕]  │  <- Header (draggable)
├─────────────────────────────────────┤
│ [Search box...]                     │  <- Search area
├─────────────────────────────────────┤
│ ▼ Database 1            (3 stores)  │
│   └ Store A                (5 items) │  <- Expandable tree
│   └ Store B               (12 items) │
│ ▶ Database 2            (1 stores)  │
│                                     │
│                                     │  <- Main content area
│   (Displays data tables, JSON, etc) │  <- Scrollable
│                                     │
├─────────────────────────────────────┤
│ [Export DB]  [Export Store]         │  <- Footer buttons
└─────────────────────────────────────┘
```

## Detailed Usage Scenarios

### Scenario 1: First Time Using the Viewer

1. Navigate to a website (e.g., www.gmail.com)
2. Wait for page to fully load
3. Look for the "📊 IndexedDB Viewer" panel in the bottom-right
4. The panel shows "Loading databases..."
5. After a moment, you'll see a list like:
   ```
   ▼ firebaseLocalStorageDb     (2 stores)
   ▼ firestore                  (3 stores)
   ```
6. Click on "firebaseLocalStorageDb" to expand it
7. See the object stores inside:
   ```
   ▼ firebaseLocalStorageDb     (2 stores)
     └ settings                   (4 items)
     └ cache                     (12 items)
   ```

### Scenario 2: Viewing Data from a Store

1. Click on "settings" from the tree above
2. A table appears showing the data:
   ```
   | Key      | Value Preview                | Action |
   |----------|------------------------------|--------|
   | pref_1   | {"theme":"dark","lang":"en"} | View   |
   | pref_2   | {"timezone":"UTC"}           | View   |
   | pref_3   | {"notifications":true}       | View   |
   ```
3. Click "View" on any row to see the full JSON:
   ```json
   {
     "theme": "dark",
     "lang": "en",
     "notifications": true
   }
   ```
4. Click "Close" or outside the modal to return to the table

### Scenario 3: Searching for Specific Data

1. You're viewing the "cache" store with many items
2. In the search box at the top, type: "user_id"
3. The table instantly filters to show only matching entries:
   ```
   | Key        | Value Preview              | Action |
   |------------|----------------------------|--------|
   | user_id_1  | {"id":1,"name":"Alice"}    | View   |
   | user_id_2  | {"id":2,"name":"Bob"}      | View   |
   ```
4. Click "View" to see full details of matching entries
5. Clear the search box to see all items again

### Scenario 4: Exporting Store Data

1. You've found interesting data in the "settings" store
2. Click "Export Store" button
3. A download dialog appears
4. File is automatically named: `idb-firebaseLocalStorageDb-settings-2024-12-18.json`
5. Save the file to your computer
6. Open the file in your text editor or JSON viewer:
   ```json
   [
     {"key": "pref_1", "value": {"theme":"dark","lang":"en"}},
     {"key": "pref_2", "value": {"timezone":"UTC"}},
     {"key": "pref_3", "value": {"notifications":true}}
   ]
   ```

### Scenario 5: Moving the Panel

1. The panel is currently in the bottom-right corner
2. You want to move it to the top-left
3. Click and hold the header (where it says "📊 IndexedDB Viewer")
4. Drag the panel to the top-left corner
5. Release the mouse button
6. Panel is now positioned at top-left
7. The position persists during the browsing session

### Scenario 6: Collapsing the Panel

1. You're browsing a website but need more screen space
2. Click the "−" button in the header
3. The panel collapses to just the header
4. Click the "+" button to expand it again

### Scenario 7: Closing the Panel

1. You're done viewing IndexedDB data
2. Click the "✕" button
3. The panel disappears
4. To access it again, refresh the page (F5)

## Working with JSON Data

### Understanding Data Structure

The viewer shows data in different formats depending on the store:

#### Format 1: Key-Value Pairs (Most Common)
```
Key: "user_123"
Value: {"name":"John","email":"john@example.com"}
```

#### Format 2: Objects with Index
```
Index: 0
Value: {"id":1,"text":"Hello"}
```

#### Format 3: Complex Nested Objects
```
Key: "config"
Value: {
  "app": {
    "name": "MyApp",
    "version": "1.0.0"
  },
  "settings": [
    {"id":1,"enabled":true}
  ]
}
```

### Exporting and Using Exported Data

**After exporting** (`idb-database-store-date.json`):

#### In Excel/Spreadsheet
1. Open Excel or Google Sheets
2. Use "Import" or "Open" to load the JSON file
3. Some spreadsheet tools have JSON import features

#### In Python
```python
import json

with open('idb-firestore-users-2024-12-18.json', 'r') as f:
    data = json.load(f)
    for item in data:
        print(f"Key: {item['key']}, Value: {item['value']}")
```

#### In JavaScript
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('export.json', 'utf8'));
console.log(data);
```

#### In Web Browser Console
```javascript
// Copy the exported file contents
const data = [/* paste JSON array here */];
console.table(data);
```

## Tips and Tricks

### Tip 1: Finding All Databases
- If you don't see your database, it might have a custom name
- Check browser DevTools (F12 → Application → IndexedDB)
- Edit the script to add custom database names (see [INSTALLATION.md](./INSTALLATION.md))

### Tip 2: Large Datasets
- The viewer shows max 1000 items per store
- Use search to narrow down what you need to see
- Export data and analyze it offline with other tools

### Tip 3: Searching Effectively
- Search is case-insensitive
- Search includes both keys and values
- Use partial searches: "user" finds "user_id", "admin_user", etc.
- For complex objects, search for field names or values

### Tip 4: Exporting for Analysis
- Export multiple stores and combine in Excel
- Export at different times to see how data changes
- Archive exports with timestamps to track history

### Tip 5: Using with DevTools
- The viewer is complementary to browser DevTools
- Use DevTools for modifying data
- Use the viewer for quick viewing and exporting

### Tip 6: Performance Optimization
- If the panel is slow, it's likely the website, not the script
- Try searching instead of viewing all data
- Export to file for offline analysis
- Try a different store first

### Tip 7: Cross-Browser Testing
- Same website may have different IndexedDB data in different browsers
- Firefox and Chrome are isolated from each other
- Useful for debugging cross-browser issues

## Common Tasks

### Task: Compare Data Across Two Websites
1. Export store from website A: `export_A.json`
2. Export store from website B: `export_B.json`
3. Use a JSON diff tool online
4. Or open both in a code editor side-by-side

### Task: Monitor How Data Changes
1. Export store data: `export_1.json`
2. Use the website for a while
3. Export same store again: `export_2.json`
4. Compare the two files to see what changed

### Task: Debug Storage Issues
1. Look at IndexedDB data to see if data is being saved
2. Check for errors in browser console (F12)
3. Search for specific keys/values you expected to save
4. Use exported data to verify structure and content

### Task: Extract Specific Fields from Complex Data
1. Export the store as JSON
2. Use a text editor or Python/Node.js to parse
3. Write a script to extract just the fields you need

Example Python script:
```python
import json

with open('export.json') as f:
    data = json.load(f)
    
for item in data:
    value = item['value']
    if isinstance(value, dict):
        print(value.get('name', 'N/A'))
```

### Task: Backup IndexedDB Data
1. Use the viewer to export each store
2. Save all exports with meaningful names
3. Store in a safe location
4. Use these backups for recovery if needed

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` (in search box) | Focus search box |
| `Enter` | Submit search (auto on type) |
| `Escape` | Close detail modal |
| Click anywhere outside modal | Close detail modal |
| `Ctrl+Shift+R` | Full page refresh (reloads viewer) |
| `F5` | Reload page (restarts viewer) |
| `F12` | Open Developer Tools (see DevTools IndexedDB) |

## Troubleshooting Common Issues

### Issue: "No IndexedDB databases found"
**Cause**: Site doesn't use IndexedDB or uses custom database names
**Solution**: 
1. Check DevTools: F12 → Application → IndexedDB
2. If databases exist, add to script's custom database list
3. If nothing exists, site doesn't use IndexedDB

### Issue: Panel shows data but export creates empty file
**Cause**: Search filter is active and filtered the view
**Solution**: Clear search before exporting, or export the filtered results intentionally

### Issue: Search doesn't find expected data
**Cause**: Search is case-sensitive OR data is deeply nested in objects
**Solution**:
1. Try different search terms
2. Check exact spelling
3. Click View to inspect JSON structure
4. Search for field names instead of values

### Issue: Cannot drag panel
**Cause**: Clicked on a button instead of header
**Solution**: Make sure to click on empty header area, not on buttons

### Issue: Panel freezes when viewing large store
**Cause**: Too much data to display at once
**Solution**:
1. Use search to filter first
2. Then view the filtered results
3. Or export directly and analyze offline

## When to Use the Viewer vs DevTools

| Task | Viewer | DevTools |
|------|--------|----------|
| Browse databases | ✅ Better | ⏹️ Functional |
| Search data | ✅ Better | ⏹️ Not easy |
| View JSON | ✅ Better | ⏹️ OK |
| Export data | ✅ Yes | ❌ No |
| Modify data | ❌ Read-only | ✅ Yes |
| Performance analysis | ⏹️ OK | ✅ Better |
| Debug storage errors | ✅ Yes | ✅ Yes |

## Advanced Usage

### Combining Exports with Command Line Tools

**Count items in exported JSON:**
```bash
cat idb-firestore-users-2024-12-18.json | jq '. | length'
```

**Extract specific field from all items:**
```bash
cat idb-firestore-users-2024-12-18.json | jq '.[] | .value.email'
```

**Pretty-print JSON export:**
```bash
cat export.json | jq '.'
```

**Merge multiple exports:**
```bash
jq -s 'add' export1.json export2.json > merged.json
```

### Automating with Scripts

After exporting, use Node.js to process:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('export.json', 'utf8'));

// Example: Group by category
const grouped = {};
data.forEach(item => {
    const category = item.value.category;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(item);
});

console.log(grouped);
```

## Getting Help

1. Check [INSTALLATION.md](./INSTALLATION.md) for installation help
2. Check [TESTING.md](./TESTING.md) for testing guide
3. Check [README.md](./README.md) for feature overview
4. Review browser console (F12 → Console) for error messages
5. Verify site actually uses IndexedDB (DevTools → Application → IndexedDB)

## Next Steps

- ✅ Installed and configured? Start exploring!
- ✅ Found interesting data? Try exporting it
- ✅ Need more info? Check specific documentation files
- ✅ Want to customize? Edit the script in Tampermonkey
