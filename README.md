# IndexedDB Viewer - Tampermonkey Script

A powerful Tampermonkey script that allows you to quickly view, search, and export IndexedDB data from any webpage.

## Features

### 🔍 Database Exploration
- **Automatic Database Detection**: Discovers IndexedDB databases on the current page
- **Tree View Structure**: Displays databases and their object stores in a collapsible tree
- **Item Counts**: Shows the number of items in each object store

### 📊 Data Viewing
- **Table View**: Display data in an organized table format with key and value columns
- **Detail View**: Click "View" to inspect individual data items as formatted JSON
- **Search & Filter**: Search through data by key or value content
- **Large Dataset Support**: Handles up to 1000 items per store with pagination

### 💾 Data Export
- **Store Export**: Export selected object store data as JSON
- **Database Export**: Export entire database as JSON
- **Timestamped Files**: Automatically generated filenames include database/store names and export date

### 🎨 User Interface
- **Dark Theme**: Modern dark color scheme optimized for developer comfort
- **Floating Panel**: Draggable panel positioned in bottom-right corner
- **Responsive Design**: Adapts to different screen sizes
- **Collapsible Interface**: Minimize or close the panel as needed
- **Clean Controls**: Intuitive buttons for all major functions

### ⚡ Performance
- **Non-blocking Initialization**: Uses `@run-at document-idle` to avoid blocking page load
- **Efficient Data Loading**: Lazy loads data only when requested
- **Memory Optimized**: Limits data display to prevent UI slowdown

## Installation

### Prerequisites
- [Tampermonkey](https://www.tampermonkey.net/) browser extension (Chrome, Firefox, Edge, etc.)

### Installation Steps

1. **Open Tampermonkey Dashboard**
   - Click the Tampermonkey extension icon in your browser
   - Select "Create a new script"

2. **Copy Script Content**
   - Open `indexeddb-viewer.js` in a text editor
   - Copy the entire content
   - Paste it into the Tampermonkey script editor

3. **Save the Script**
   - Press `Ctrl+S` (or `Cmd+S` on Mac) to save
   - Close the editor
   - The script is now installed and active

### Alternative: Direct Installation

You can also save the script to your Tampermonkey scripts folder:

1. Copy `indexeddb-viewer.js` to your Tampermonkey scripts directory
2. Restart your browser or reload the Tampermonkey extension
3. The script will be automatically detected and installed

## Usage

### Accessing the Viewer

1. **Navigate to any webpage** with IndexedDB databases
2. **Look for the panel** in the bottom-right corner with the icon "📊 IndexedDB Viewer"
3. The panel will automatically load when the page finishes loading

### Basic Operations

#### Exploring Databases
1. Click on database names to expand/collapse the tree
2. Database names and store counts are displayed automatically
3. Click on an object store to view its data

#### Viewing Data
1. Click on an object store in the left panel
2. Data appears in a table with columns for Key, Value, and Action
3. Click "View" next to any row to see the full JSON details
4. The detail view opens in a modal dialog

#### Searching Data
1. Use the search box at the top of the panel
2. Search by key name or value content
3. Results update in real-time as you type
4. Clear the search box to see all data again

#### Exporting Data
1. **Export Store**: Click "Export Store" button to download the current store as JSON
2. **Export DB**: Click "Export DB" button to download database metadata
3. Files are saved with automatic naming: `idb-{dbName}-{storeName}-{date}.json`

#### Managing the Panel
- **Drag**: Click and drag the header to move the panel
- **Minimize**: Click the "−" button to collapse the panel
- **Close**: Click "✕" to hide the panel
- **Refresh**: Click "🔄" to reload databases

## Technical Details

### Architecture

The script consists of two main classes:

#### `IndexedDBViewer`
- Handles all IndexedDB API interactions
- Methods for loading databases, stores, and data
- Export functionality for JSON files

#### `ViewerUI`
- Manages the user interface and DOM elements
- Event listeners for user interactions
- Data rendering and filtering logic

### Supported Browsers

- ✅ Chrome/Chromium (with Tampermonkey)
- ✅ Firefox (with Greasemonkey/Tampermonkey)
- ✅ Edge (with Tampermonkey)
- ✅ Opera (with Tampermonkey)
- ✅ Safari (with Tampermonkey)

### Permissions

The script uses the following Tampermonkey @grants:
- `@grant GM_openInTab` - For opening tabs (future enhancement)
- `@grant GM_download` - For downloading files (future enhancement)

Note: Most operations use standard browser APIs that don't require grants.

### Limitations

1. **Database Detection**: The script attempts to open common database names. Custom database names may not be automatically detected. You can still manually access them if you know the name.

2. **Data Limit**: Shows maximum 1000 items per store to maintain performance. Very large stores will be truncated.

3. **CORS & Security**: The script respects browser security policies. It can only access databases from the current origin.

4. **Browser Compatibility**: Some older browsers may not support all IndexedDB features.

## Data Privacy & Security

- **Local Processing**: All operations are performed locally in your browser
- **No Data Collection**: The script does not send any data to external servers
- **No Persistence**: Exported files are stored only where you save them
- **Source Code**: The script is open source and can be audited for security concerns

## Keyboard Shortcuts

- **Click on database/store**: Expand/collapse or select
- **Click "View"**: Open detail modal
- **Search box**: Type to filter data in real-time
- **Escape key**: Close detail modal (when applicable)

## Troubleshooting

### Panel Not Appearing
1. Check that Tampermonkey is enabled in your browser
2. Verify the script is active in Tampermonkey dashboard
3. Try refreshing the page
4. Check browser console for errors (F12)

### No Databases Found
1. The site may not use IndexedDB
2. IndexedDB data may be stored under a custom name not recognized by the script
3. Try opening browser DevTools (F12) → Application → IndexedDB to see what databases exist
4. The script can only detect common database names out of the box

### Export Not Working
1. Verify browser allows downloads (check download settings)
2. Try downloading a different store
3. Check if file was downloaded but not visible (check Downloads folder)

### Performance Issues
1. Close unnecessary tabs to free up memory
2. Limit search results by using more specific search terms
3. Try viewing smaller stores first
4. Increase browser tab's available memory (close other applications)

## Development

### Modifying the Script

1. Open Tampermonkey dashboard → Edit script
2. Make your changes
3. Save (Ctrl+S)
4. Reload the target webpage to test

### Adding Custom Database Names

To add custom database names to detection, modify this section in the script:

```javascript
const commonDbs = ['firebaseLocalStorageDb', 'firestore', 'localDB', 'appDb', 'cache', 'yourCustomDb'];
```

### Extending Functionality

The script is structured for easy extension:
- Add new export formats by modifying `exportToJSON()`
- Create new data visualization methods by extending `ViewerUI`
- Add filters by modifying `filterData()`

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style conventions
- Changes maintain browser compatibility
- Documentation is updated accordingly
- Features don't negatively impact performance

## License

This script is provided as-is for development and educational purposes.

## Support

For issues, questions, or feature requests, please check:
1. The troubleshooting section above
2. Browser console for error messages
3. Tampermonkey documentation for permission issues

## Version History

### v1.0.0
- Initial release
- Core database and store exploration
- Data viewing with search/filter
- JSON export functionality
- Dark theme UI with draggable panel
- Support for multiple browsers

## Related Resources

- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [MDN IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [IndexedDB Concepts](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Concepts_Behind_IndexedDB)
