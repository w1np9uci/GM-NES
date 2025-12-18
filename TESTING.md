# IndexedDB Viewer - Testing Guide

## Testing Checklist

This guide helps you thoroughly test the IndexedDB Viewer script to ensure all features work correctly.

## Pre-Testing Setup

### 1. Verify Installation
- [ ] Tampermonkey extension is installed and enabled
- [ ] IndexedDB Viewer script is installed and shows "Enabled" in dashboard
- [ ] Browser supports IndexedDB (check: `console.log(!!window.indexedDB)`)
- [ ] Using a modern browser (Chrome, Firefox, Edge, or Safari)

### 2. Test Websites with IndexedDB

The following websites are known to use IndexedDB and are good for testing:

**Free & Always Available:**
- ✅ https://firebase-demo.web.app/ (Firebase demo with data)
- ✅ https://mail.google.com (Gmail - requires login)
- ✅ https://web.facebook.com (Facebook - requires login)
- ✅ https://web.whatsapp.com (WhatsApp Web - requires login)
- ✅ https://trello.com (Trello boards - requires login)
- ✅ https://notion.so (Notion - requires login)

**Developer-Friendly Test Sites:**
- ✅ https://mdn.github.io/dom-examples/indexeddb-api/ (MDN examples)
- ✅ https://github.com (requires login)

**Note**: Most require login. For pure testing, create a simple test page with IndexedDB (see below).

## Creating a Test Page with IndexedDB

Create a simple HTML file to test without needing to log in anywhere:

```html
<!DOCTYPE html>
<html>
<head>
    <title>IndexedDB Test Page</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        button { padding: 10px 15px; margin: 5px; cursor: pointer; }
        .status { margin-top: 20px; padding: 10px; background: white; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>IndexedDB Test Database</h1>
    <div>
        <button onclick="createDatabase()">Create Test Database</button>
        <button onclick="addTestData()">Add Test Data</button>
        <button onclick="viewInDevTools()">View in DevTools</button>
    </div>
    <div class="status" id="status">Ready</div>

    <script>
        const DB_NAME = 'TestDB';
        const STORE_NAME = 'TestStore';
        let db;

        async function createDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = (e) => {
                    db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                    updateStatus('Database created successfully');
                };
                request.onsuccess = (e) => {
                    db = e.target.result;
                    updateStatus('Database opened: ' + DB_NAME);
                    resolve();
                };
                request.onerror = () => {
                    updateStatus('Error: ' + request.error);
                    reject();
                };
            });
        }

        async function addTestData() {
            if (!db) {
                updateStatus('Create database first');
                return;
            }

            const testData = [
                { id: 1, name: 'Alice', email: 'alice@example.com', created: new Date() },
                { id: 2, name: 'Bob', email: 'bob@example.com', created: new Date() },
                { id: 3, name: 'Charlie', email: 'charlie@example.com', created: new Date() },
                { id: 4, name: 'Diana', email: 'diana@example.com', created: new Date() },
                { id: 5, name: 'Eve', email: 'eve@example.com', created: new Date() },
            ];

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            testData.forEach(item => {
                store.add(item);
            });

            transaction.oncomplete = () => {
                updateStatus('Added 5 test records');
            };
            transaction.onerror = () => {
                updateStatus('Error adding data');
            };
        }

        function viewInDevTools() {
            updateStatus('Open DevTools: F12 → Application → IndexedDB → ' + DB_NAME + ' → ' + STORE_NAME);
        }

        function updateStatus(msg) {
            document.getElementById('status').textContent = msg;
        }

        // Auto-create on load
        window.addEventListener('load', async () => {
            await createDatabase();
        });
    </script>
</body>
</html>
```

Save this as `test-page.html`, open it in your browser, and click "Create Test Database" and "Add Test Data".

## Test Cases

### 1. Panel Display and Initialization

**Test**: Panel appears on page load
- [ ] Visit a website with IndexedDB (or use test page above)
- [ ] Wait for page to fully load
- [ ] Panel should appear in bottom-right corner with "📊 IndexedDB Viewer" title
- [ ] Panel should show "Loading databases..." initially
- [ ] Database list should populate after a moment

**Expected**: Panel visible and databases load successfully

---

### 2. Database Tree Navigation

**Test**: Can explore database structure
- [ ] Database names are displayed in the left panel
- [ ] Each database shows store count (e.g., "2 stores")
- [ ] Click on database name to expand/collapse the tree
- [ ] Object store names appear nested under database
- [ ] Each store shows item count (e.g., "5 items")

**Expected**: Tree structure displays correctly and expands/collapses smoothly

---

### 3. Viewing Store Data

**Test**: Can view data from object stores
- [ ] Click on an object store name
- [ ] Data table appears with columns: Key, Value Preview, Action
- [ ] Table shows correct number of rows matching item count
- [ ] Data preview is truncated with "..." if too long
- [ ] Values display as formatted JSON or simple text

**Expected**: Data displays correctly in table format

---

### 4. Search and Filter Functionality

**Test**: Search filters data correctly
- [ ] Type in the search box at the top of the panel
- [ ] Table updates in real-time to show matching items
- [ ] Search works on both key and value content
- [ ] Clearing the search box shows all data again
- [ ] Case-insensitive matching works
- [ ] Partial matches work (e.g., search "ali" finds "alice@example.com")

**Expected**: Search results filter correctly and update in real-time

---

### 5. Detail View Modal

**Test**: Can view full JSON details
- [ ] Click "View" button on any table row
- [ ] Modal dialog appears with full JSON
- [ ] Modal shows key if data has keys
- [ ] JSON is properly formatted and indented
- [ ] Modal can be closed by clicking "Close" button
- [ ] Modal can be closed by clicking outside of it
- [ ] Large JSON objects display with proper scrolling

**Expected**: Detail modal opens and displays formatted JSON correctly

---

### 6. Data Export - Store Export

**Test**: Can export store data as JSON
- [ ] Select an object store to view its data
- [ ] Click "Export Store" button
- [ ] File dialog appears to save file
- [ ] File name contains database name, store name, and date
- [ ] Format: `idb-{dbName}-{storeName}-{date}.json`
- [ ] Downloaded file contains valid JSON
- [ ] JSON structure matches displayed data

**Steps to verify file**:
1. After downloading, open the file with a text editor
2. Verify it's valid JSON: `JSON.parse(fileContent)` should work
3. Check that all visible data is in the exported JSON

**Expected**: File downloads with correct naming and contains valid JSON data

---

### 7. Data Export - Database Export

**Test**: Can export database metadata
- [ ] With any database selected
- [ ] Click "Export DB" button
- [ ] File dialog appears to save file
- [ ] File name format: `idb-{dbName}-{date}.json`
- [ ] File contains database metadata

**Expected**: Database file downloads successfully

---

### 8. Panel Controls

**Test**: All panel buttons work correctly

**Refresh button (🔄)**:
- [ ] Databases reload when clicked
- [ ] Previously viewed store data is cleared
- [ ] Useful for detecting new databases added during session

**Toggle button (−)**:
- [ ] Collapses the panel when clicked
- [ ] Button changes to "+" when collapsed
- [ ] Expands the panel again when clicked
- [ ] Button changes back to "−" when expanded

**Close button (✕)**:
- [ ] Panel is hidden when clicked
- [ ] Panel is still running (data not lost)
- [ ] Can't see the panel anymore but it's still there

**Expected**: All buttons perform their intended functions

---

### 9. Panel Dragging

**Test**: Panel can be moved by dragging header
- [ ] Click and hold the header (not on buttons)
- [ ] Drag the panel to a new location
- [ ] Panel moves smoothly with the mouse
- [ ] Panel stays visible during drag
- [ ] Release mouse to stop dragging
- [ ] Panel stays at new position

**Expected**: Panel can be repositioned via dragging

---

### 10. Large Dataset Performance

**Test**: Panel handles large datasets without freezing

**Setup**:
1. Create a test database with 1000+ items
2. Try to view the data

**Expected**:
- [ ] Panel doesn't freeze or become unresponsive
- [ ] Data displays (max 1000 items)
- [ ] Search still works on large datasets
- [ ] Can scroll through the table smoothly
- [ ] Exporting still works

---

### 11. Multiple Browsers/Devices

**Test**: Script works across different browsers

Test on each available browser:
- [ ] Chrome/Chromium-based browsers
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

For each browser:
- [ ] Tampermonkey installs correctly
- [ ] Script loads on pages
- [ ] UI displays properly
- [ ] All features work

**Expected**: Script works on all major browsers

---

### 12. Error Handling

**Test**: Script handles errors gracefully

**Scenario 1**: Site without IndexedDB
- [ ] Visit a site that doesn't use IndexedDB
- [ ] Panel should show "No IndexedDB databases found"
- [ ] No errors in console

**Scenario 2**: No permission to access store
- [ ] Some stores may be protected
- [ ] Should show error message in panel
- [ ] Doesn't crash

**Scenario 3**: Empty object store
- [ ] Store with 0 items
- [ ] Panel shows "No data in this store"
- [ ] No errors displayed

**Expected**: All error scenarios handled gracefully with informative messages

---

### 13. Page Performance

**Test**: Script doesn't slow down page loading

- [ ] Page load time isn't noticeably affected
- [ ] Page rendering isn't blocked
- [ ] Panel appears after page is interactive
- [ ] Page scrolling is still smooth
- [ ] No excessive CPU usage

**How to check**:
1. Open DevTools (F12)
2. Go to Performance tab
3. Record a page load with and without the script
4. Compare performance metrics

**Expected**: Page performance not significantly impacted

---

### 14. HTML Escaping and Security

**Test**: Script safely handles special characters

**Setup**: Create data with special characters:
```javascript
// In your test database, add items with special characters
{ id: 1, text: '<script>alert("xss")</script>' },
{ id: 2, text: '"quoted"' },
{ id: 3, text: "'" },
{ id: 4, text: '&amp;' }
```

**Test**:
- [ ] Special characters display as text, not interpreted
- [ ] No script injections occur
- [ ] HTML entities are properly escaped
- [ ] Export file contains raw, unescaped JSON

**Expected**: Special characters handled safely, no security issues

---

### 15. Cross-Domain Behavior

**Test**: Script respects same-origin policy

- [ ] Script only accesses IndexedDB from current origin
- [ ] Cannot access iframes' IndexedDB (expected browser restriction)
- [ ] No security warnings in console

**Expected**: Same-origin policy respected

---

## Automated Test Checklist

Run these quick checks:

```javascript
// In browser console on any page with the script:

// Check if script loaded
console.log('IndexedDB available:', !!window.indexedDB);

// Check for common database names
const testDbs = ['firebaseLocalStorageDb', 'firestore', 'localDB'];
testDbs.forEach(dbName => {
    indexedDB.open(dbName).onsuccess = (e) => {
        console.log(dbName + ':', e.target.result.objectStoreNames.length, 'stores');
        e.target.result.close();
    };
});
```

---

## Performance Benchmarks

Run these measurements to ensure good performance:

```javascript
// Time to load databases
console.time('Load databases');
// (view first database)
console.timeEnd('Load databases');
// Expected: < 100ms

// Time to load store data
console.time('Load store data');
// (view data in store with ~500 items)
console.timeEnd('Load store data');
// Expected: < 200ms

// Time to search
console.time('Search');
// (type in search box)
console.timeEnd('Search');
// Expected: < 50ms
```

---

## Regression Test Checklist

After making changes to the script:

- [ ] Panel still appears on page load
- [ ] Databases still load correctly
- [ ] Can view store data
- [ ] Search works
- [ ] Export works
- [ ] No console errors
- [ ] No performance degradation
- [ ] All buttons function correctly
- [ ] Panel dragging still works
- [ ] Detail modal works

---

## Known Limitations (Expected Behavior)

These are expected and not bugs:

- ✓ Cannot detect custom database names automatically
- ✓ Shows max 1000 items per store (performance optimization)
- ✓ Some sites may block script injection (browser security)
- ✓ Cannot modify IndexedDB data (read-only by design)
- ✓ Cannot access IndexedDB from iframes in other origins
- ✓ Private browsing may have restrictions depending on browser

---

## Reporting Issues

If you find a problem:

1. **Reproduce**: Can you consistently reproduce the issue?
2. **Website**: Which website does it happen on?
3. **Browser**: Which browser and version?
4. **Steps**: List exact steps to reproduce
5. **Expected vs Actual**: What should happen vs what does happen
6. **Console**: Any errors in browser console (F12)?

---

## Version Testing Notes

### v1.0.0
- Initial release
- Core features tested on:
  - Chrome 120+
  - Firefox 121+
  - Edge 120+
  - Safari 17+
- Tested with Firebase, Gmail, WhatsApp Web, Trello

---

## Support for Testers

If you're testing this script:

1. Make sure you have a clear testing environment
2. Test on multiple sites, not just one
3. Report any bugs with specific reproduction steps
4. Note what browser and version you're using
5. Include console error messages if any

**Thank you for testing the IndexedDB Viewer! Your feedback helps make it better.**
