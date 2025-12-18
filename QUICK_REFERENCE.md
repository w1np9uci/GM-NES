# IndexedDB Viewer - Quick Reference Card

## Installation (3 Steps)

1. Install [Tampermonkey](https://tampermonkey.net) extension
2. Create new script → Copy `indexeddb-viewer.js` content → Save
3. Done! Panel appears on any website

## Main Interface

```
┌─ Header (drag to move) ────────────────────┐
│ 📊 IndexedDB Viewer  [🔄 Refresh] [−] [✕] │
├────────────────────────────────────────────┤
│ [Search........................]            │ ← Search box
├────────────────────────────────────────────┤
│ ▼ DatabaseName     (3 stores)              │ ← Click to expand
│   ├ StoreName 1    (10 items)              │ ← Click to view data
│   ├ StoreName 2    (5 items)               │
│   └ StoreName 3    (0 items)               │
│                                            │
│ ┌─────────────────────────────────────────┐│
│ │ Key     Value Preview         Action    ││ ← Data table
│ │ key_1   {"name":"Alice"}      View      ││
│ │ key_2   {"name":"Bob"}        View      ││
│ │ key_3   {"name":"Charlie"}    View      ││
│ └─────────────────────────────────────────┘│
├────────────────────────────────────────────┤
│ [Export DB]  [Export Store]                │ ← Export buttons
└────────────────────────────────────────────┘
```

## Essential Buttons & Controls

| Button | Function | Shortcut |
|--------|----------|----------|
| 🔄 | Reload all databases | - |
| − | Collapse/minimize panel | - |
| ✕ | Hide panel | - |
| View | Show full JSON details | Click in table |
| Export DB | Download database meta | - |
| Export Store | Download store data | - |
| Click header | Drag panel to new position | - |

## Common Tasks

### View Data
1. Click database to expand
2. Click store name
3. Table appears with data

### Search Data
1. Type in search box
2. Results filter instantly
3. Clear to see all again

### See Full Details
1. Click "View" on any table row
2. Modal shows formatted JSON
3. Click "Close" to return

### Export Data
1. Click "Export Store"
2. Select save location
3. File saved as JSON

### Move Panel
1. Click and drag header
2. Release to drop
3. Position remembered during session

## Keyboard Shortcuts

- **Ctrl+F** in search box to focus
- **Escape** to close detail modal
- **Ctrl+Shift+R** to refresh page (reloads panel)
- **F12** to open DevTools (see DevTools IndexedDB view)

## File Naming Convention

Exported files are automatically named:

```
idb-{DatabaseName}-{StoreName}-{YYYY-MM-DD}.json
```

Example: `idb-firestore-users-2024-12-18.json`

## What You Can Do

✅ View IndexedDB data from any website
✅ Search and filter data
✅ See data as formatted JSON
✅ Export data as JSON files
✅ Move the panel around
✅ Minimize or hide the panel
✅ Explore multiple databases
✅ See item counts per store

## What You Cannot Do

❌ Modify data (read-only by design)
❌ Access data from other origins (browser security)
❌ Delete data (read-only access)
❌ Access private browsing data (depending on browser)

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Panel doesn't appear | Refresh page with F5 |
| No databases found | Check DevTools F12 → Application → IndexedDB |
| Search not working | Make sure you're typing in search box |
| Export not working | Try different store, check browser download settings |
| Panel is slow | Try searching instead of viewing all data |

## Documentation Index

- **README.md** - Features, permissions, support
- **INSTALLATION.md** - Detailed setup & config
- **USAGE.md** - How to use each feature
- **TESTING.md** - Testing procedures & examples
- **PROJECT_SUMMARY.md** - Technical overview
- **QUICK_REFERENCE.md** - This file

## Supported Browsers

- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Edge 120+
- ✅ Safari 17+
- ✅ Opera (Chromium-based)

## Version

Current: **v1.0.0** (2024-12-18)

## Key Features

🎯 **Database Exploration**
- Auto-detect IndexedDB databases
- Show object stores and item counts
- Collapsible tree view

🔍 **Data Viewing**
- Table format display
- Detail JSON view
- Real-time search & filter

💾 **Data Export**
- One-click JSON export
- Auto-generated filenames
- Timestamps included

🎨 **User Interface**
- Dark theme (easy on eyes)
- Draggable panel
- Responsive design
- Intuitive controls

⚡ **Performance**
- Doesn't slow down pages
- Efficient data loading
- Handles large datasets

## Common Database Names

The script detects these by default:
- firebaseLocalStorageDb
- firestore
- localDB
- appDb
- cache

For custom names, edit the script (see INSTALLATION.md)

## Tips for Best Results

1. **Searching**: Use search to filter before viewing large stores
2. **Exporting**: Export regularly to backup important data
3. **Different Sites**: Same site may have different data in different browsers
4. **DevTools**: Use with browser DevTools (F12) for debugging
5. **Offline Analysis**: Export to JSON, then analyze with other tools

## Getting Help

1. **Installation issues?** → See INSTALLATION.md
2. **How to use?** → See USAGE.md
3. **Testing problems?** → See TESTING.md
4. **Technical questions?** → See PROJECT_SUMMARY.md
5. **Browser console** → F12 → Console tab (check for errors)

## Example Workflow

```
1. Visit Gmail → 📊 panel appears
2. See "firebaseLocalStorageDb" with stores
3. Click "settings" store
4. Type "theme" in search
5. See filtered results
6. Click "View" to see JSON
7. Click "Export Store"
8. Download settings-YYYY-MM-DD.json
9. Open in text editor or JSON viewer
10. Done! ✓
```

## Security Notes

✅ **Safe to use**: Script only reads data, never modifies
✅ **Private**: All processing in your browser
✅ **No tracking**: Doesn't collect or send any data
✅ **Open source**: Code is transparent and auditable

## Next Steps

- ✅ Install the script (INSTALLATION.md)
- ✅ Visit a website with IndexedDB
- ✅ Look for the 📊 panel
- ✅ Explore and export data
- ✅ Read full docs for advanced features

---

**Need more info? Check the documentation files above!**

**Happy data exploring! 🚀**
