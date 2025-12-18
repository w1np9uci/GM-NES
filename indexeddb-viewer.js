// ==UserScript==
// @name         IndexedDB Viewer
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  View and export IndexedDB data from any webpage
// @author       IndexedDB Viewer Team
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACw=
// @grant        GM_openInTab
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'idbViewer_state';
    let viewerPanel = null;
    let currentDatabase = null;
    let currentStore = null;
    let allData = [];
    let filteredData = [];

    class IndexedDBViewer {
        constructor() {
            this.databases = [];
            this.currentSearch = '';
        }

        async initialize() {
            try {
                await this.loadDatabases();
            } catch (error) {
                console.error('Failed to initialize IndexedDB Viewer:', error);
            }
        }

        async loadDatabases() {
            this.databases = [];
            try {
                // Try to get all databases if available (not universally supported)
                if (indexedDB.databases && typeof indexedDB.databases === 'function') {
                    const dbs = await indexedDB.databases();
                    this.databases = dbs.map(db => ({ name: db.name, version: db.version }));
                } else {
                    // Fallback: we can't enumerate databases without the API
                    // The viewer will attempt to detect databases through other means
                    console.log('indexedDB.databases() not supported on this browser');
                }
            } catch (error) {
                console.error('Error loading databases:', error);
            }
        }

        async getStoresForDatabase(dbName) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => {
                    const db = request.result;
                    const stores = Array.from(db.objectStoreNames).map(name => ({
                        name: name,
                        count: null
                    }));
                    db.close();
                    resolve(stores);
                };
                request.onerror = () => reject(request.error);
            });
        }

        async getStoreCount(dbName, storeName) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => {
                    const db = request.result;
                    try {
                        const transaction = db.transaction(storeName, 'readonly');
                        const store = transaction.objectStore(storeName);
                        const countRequest = store.count();
                        countRequest.onsuccess = () => {
                            db.close();
                            resolve(countRequest.result);
                        };
                        countRequest.onerror = () => {
                            db.close();
                            reject(countRequest.error);
                        };
                    } catch (error) {
                        db.close();
                        reject(error);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        }

        async getStoreData(dbName, storeName, limit = 1000) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => {
                    const db = request.result;
                    try {
                        const transaction = db.transaction(storeName, 'readonly');
                        const store = transaction.objectStore(storeName);
                        const dataRequest = store.getAll();
                        const data = [];

                        dataRequest.onsuccess = () => {
                            const result = dataRequest.result || [];
                            data.push(...result.slice(0, limit));
                            db.close();
                            resolve(data);
                        };

                        dataRequest.onerror = () => {
                            db.close();
                            reject(dataRequest.error);
                        };
                    } catch (error) {
                        db.close();
                        reject(error);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        }

        async getStoreDataWithKeys(dbName, storeName, limit = 1000) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => {
                    const db = request.result;
                    try {
                        const transaction = db.transaction(storeName, 'readonly');
                        const store = transaction.objectStore(storeName);
                        const keysRequest = store.getAllKeys();
                        const data = [];

                        keysRequest.onsuccess = () => {
                            const keys = keysRequest.result || [];
                            let processed = 0;

                            if (keys.length === 0) {
                                db.close();
                                resolve(data);
                                return;
                            }

                            keys.slice(0, limit).forEach(key => {
                                const getRequest = store.get(key);
                                getRequest.onsuccess = () => {
                                    data.push({
                                        key: key,
                                        value: getRequest.result
                                    });
                                    processed++;
                                    if (processed === Math.min(keys.length, limit)) {
                                        db.close();
                                        resolve(data);
                                    }
                                };
                            });
                        };

                        keysRequest.onerror = () => {
                            db.close();
                            reject(keysRequest.error);
                        };
                    } catch (error) {
                        db.close();
                        reject(error);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        }

        exportToJSON(data, fileName) {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }

        exportDatabase(dbName) {
            const timestamp = new Date().toISOString().split('T')[0];
            const fileName = `idb-${dbName}-${timestamp}.json`;
            this.exportToJSON({ database: dbName, exportedAt: new Date().toISOString() }, fileName);
        }

        exportStore(dbName, storeName, data) {
            const timestamp = new Date().toISOString().split('T')[0];
            const fileName = `idb-${dbName}-${storeName}-${timestamp}.json`;
            this.exportToJSON(data, fileName);
        }
    }

    class ViewerUI {
        constructor(viewer) {
            this.viewer = viewer;
            this.isVisible = true;
            this.isCollapsed = false;
            this.dragData = null;
            this.createPanel();
            this.attachEventListeners();
        }

        createPanel() {
            const panel = document.createElement('div');
            panel.id = 'idb-viewer-panel';
            panel.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 450px;
                height: 600px;
                background: #1e1e1e;
                border: 1px solid #404040;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                font-size: 12px;
                color: #e0e0e0;
                z-index: 2147483647;
                display: flex;
                flex-direction: column;
                user-select: none;
            `;

            const header = document.createElement('div');
            header.className = 'idb-viewer-header';
            header.style.cssText = `
                background: #252525;
                border-bottom: 1px solid #404040;
                padding: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                min-height: 44px;
            `;
            header.innerHTML = `
                <div style="font-weight: 600; color: #4db8ff; display: flex; align-items: center; gap: 8px;">
                    <span>📊 IndexedDB Viewer</span>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="idb-viewer-btn idb-viewer-btn-refresh" title="Refresh" style="width: 28px; height: 28px;">🔄</button>
                    <button class="idb-viewer-btn idb-viewer-btn-toggle" title="Toggle" style="width: 28px; height: 28px;">−</button>
                    <button class="idb-viewer-btn idb-viewer-btn-close" title="Close" style="width: 28px; height: 28px;">✕</button>
                </div>
            `;

            const content = document.createElement('div');
            content.className = 'idb-viewer-content';
            content.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;

            const searchBox = document.createElement('div');
            searchBox.className = 'idb-viewer-search';
            searchBox.style.cssText = `
                padding: 10px;
                border-bottom: 1px solid #404040;
                background: #1e1e1e;
            `;
            searchBox.innerHTML = `
                <input type="text" class="idb-viewer-search-input" placeholder="Search data..." style="
                    width: 100%;
                    padding: 6px 8px;
                    background: #2a2a2a;
                    border: 1px solid #404040;
                    border-radius: 4px;
                    color: #e0e0e0;
                    box-sizing: border-box;
                    font-size: 12px;
                " />
            `;

            const mainContent = document.createElement('div');
            mainContent.className = 'idb-viewer-main';
            mainContent.style.cssText = `
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
            `;
            mainContent.innerHTML = '<div style="padding: 15px; color: #888; text-align: center;">Loading databases...</div>';

            const footer = document.createElement('div');
            footer.className = 'idb-viewer-footer';
            footer.style.cssText = `
                background: #252525;
                border-top: 1px solid #404040;
                padding: 10px;
                display: flex;
                gap: 6px;
            `;
            footer.innerHTML = `
                <button class="idb-viewer-btn idb-viewer-btn-export-db" style="flex: 1;">Export DB</button>
                <button class="idb-viewer-btn idb-viewer-btn-export-store" style="flex: 1;">Export Store</button>
            `;

            content.appendChild(searchBox);
            content.appendChild(mainContent);
            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(footer);

            this.applyButtonStyles();

            document.body.appendChild(panel);
            viewerPanel = panel;
            this.header = header;
            this.content = mainContent;
            this.panel = panel;
        }

        applyButtonStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .idb-viewer-btn {
                    padding: 4px 8px;
                    background: #2a2a2a;
                    border: 1px solid #404040;
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }
                .idb-viewer-btn:hover {
                    background: #3a3a3a;
                    border-color: #505050;
                }
                .idb-viewer-btn:active {
                    background: #2a2a2a;
                    border-color: #404040;
                }
                .idb-viewer-tree-item {
                    padding: 6px 10px;
                    border-bottom: 1px solid #2a2a2a;
                    cursor: pointer;
                    transition: background 0.1s ease;
                }
                .idb-viewer-tree-item:hover {
                    background: #2a2a2a;
                }
                .idb-viewer-tree-item.active {
                    background: #1f4a6f;
                    color: #4db8ff;
                }
                .idb-viewer-tree-toggle {
                    display: inline-block;
                    width: 16px;
                    cursor: pointer;
                }
                .idb-viewer-tree-item-label {
                    display: inline-block;
                    flex: 1;
                }
                .idb-viewer-tree-item-count {
                    display: inline-block;
                    background: #2a2a2a;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 11px;
                    color: #999;
                }
                .idb-viewer-data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                }
                .idb-viewer-data-table th {
                    background: #252525;
                    padding: 6px 8px;
                    text-align: left;
                    border-bottom: 1px solid #404040;
                    font-weight: 600;
                    color: #4db8ff;
                    position: sticky;
                    top: 0;
                }
                .idb-viewer-data-table td {
                    padding: 6px 8px;
                    border-bottom: 1px solid #2a2a2a;
                    word-break: break-all;
                }
                .idb-viewer-data-table tr:hover {
                    background: #252525;
                }
                .idb-viewer-json {
                    padding: 10px;
                    background: #1a1a1a;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 11px;
                    color: #99cc99;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
            `;
            document.head.appendChild(style);
        }

        attachEventListeners() {
            const closeBtn = this.panel.querySelector('.idb-viewer-btn-close');
            const toggleBtn = this.panel.querySelector('.idb-viewer-btn-toggle');
            const refreshBtn = this.panel.querySelector('.idb-viewer-btn-refresh');
            const exportDbBtn = this.panel.querySelector('.idb-viewer-btn-export-db');
            const exportStoreBtn = this.panel.querySelector('.idb-viewer-btn-export-store');
            const searchInput = this.panel.querySelector('.idb-viewer-search-input');
            const header = this.header;

            closeBtn.addEventListener('click', () => this.toggleVisibility());
            toggleBtn.addEventListener('click', () => this.toggleCollapse());
            refreshBtn.addEventListener('click', () => this.loadDatabases());
            exportDbBtn.addEventListener('click', () => this.handleExportDatabase());
            exportStoreBtn.addEventListener('click', () => this.handleExportStore());
            searchInput.addEventListener('input', (e) => this.filterData(e.target.value));

            // Dragging
            header.addEventListener('mousedown', (e) => this.startDrag(e));
            document.addEventListener('mousemove', (e) => this.drag(e));
            document.addEventListener('mouseup', () => this.endDrag());
        }

        startDrag(e) {
            if (e.target.closest('.idb-viewer-btn')) return;
            this.dragData = {
                x: e.clientX,
                y: e.clientY,
                panelX: this.panel.offsetLeft,
                panelY: this.panel.offsetTop
            };
        }

        drag(e) {
            if (!this.dragData) return;
            const deltaX = e.clientX - this.dragData.x;
            const deltaY = e.clientY - this.dragData.y;
            this.panel.style.left = (this.dragData.panelX + deltaX) + 'px';
            this.panel.style.right = 'auto';
            this.panel.style.top = (this.dragData.panelY + deltaY) + 'px';
            this.panel.style.bottom = 'auto';
        }

        endDrag() {
            this.dragData = null;
        }

        toggleVisibility() {
            this.isVisible = !this.isVisible;
            this.panel.style.display = this.isVisible ? 'flex' : 'none';
        }

        toggleCollapse() {
            this.isCollapsed = !this.isCollapsed;
            const content = this.panel.querySelector('.idb-viewer-content');
            const footer = this.panel.querySelector('.idb-viewer-footer');
            const toggleBtn = this.panel.querySelector('.idb-viewer-btn-toggle');

            if (this.isCollapsed) {
                content.style.display = 'none';
                footer.style.display = 'none';
                toggleBtn.textContent = '+';
            } else {
                content.style.display = 'flex';
                footer.style.display = 'flex';
                toggleBtn.textContent = '−';
            }
        }

        async loadDatabases() {
            try {
                const content = this.content;
                content.innerHTML = '<div style="padding: 15px; color: #888; text-align: center;">Loading databases...</div>';

                // Use common IndexedDB database names as a fallback
                const commonDbs = ['firebaseLocalStorageDb', 'firestore', 'localDB', 'appDb', 'cache'];
                const databases = [];

                // Try to open common databases
                for (const dbName of commonDbs) {
                    try {
                        const stores = await this.viewer.getStoresForDatabase(dbName);
                        if (stores.length > 0) {
                            databases.push({ name: dbName, stores: stores });
                        }
                    } catch (e) {
                        // Database doesn't exist or can't be accessed
                    }
                }

                if (databases.length === 0) {
                    content.innerHTML = `
                        <div style="padding: 15px; color: #888;">
                            <div style="margin-bottom: 10px;">No IndexedDB databases found.</div>
                            <div style="font-size: 11px; color: #666;">
                                The viewer checks common database names. If your site uses custom names, they won't appear here.
                            </div>
                        </div>
                    `;
                    return;
                }

                await this.renderDatabases(databases);
            } catch (error) {
                this.content.innerHTML = `<div style="padding: 15px; color: #ff6b6b;">Error: ${error.message}</div>`;
            }
        }

        async renderDatabases(databases) {
            const html = databases.map((db, dbIndex) => {
                const storesHtml = db.stores.map((store, storeIndex) => `
                    <div class="idb-viewer-tree-item" style="padding-left: 40px; display: flex; align-items: center;" data-db="${dbIndex}" data-store="${storeIndex}">
                        <span class="idb-viewer-tree-label" style="flex: 1; cursor: pointer;">${this.escapeHtml(store.name)}</span>
                        <span class="idb-viewer-tree-item-count">Loading...</span>
                    </div>
                `).join('');

                return `
                    <div style="border-bottom: 1px solid #2a2a2a;">
                        <div class="idb-viewer-tree-item" data-db="${dbIndex}" style="display: flex; align-items: center;">
                            <span class="idb-viewer-tree-toggle" style="display: inline-block;">▼</span>
                            <span class="idb-viewer-tree-label" style="flex: 1; cursor: pointer;">${this.escapeHtml(db.name)}</span>
                            <span class="idb-viewer-tree-item-count">${db.stores.length} stores</span>
                        </div>
                        <div class="idb-viewer-tree-children" style="display: none;">
                            ${storesHtml}
                        </div>
                    </div>
                `;
            }).join('');

            this.content.innerHTML = html;
            this.attachDatabaseEventListeners(databases);
            await this.loadStoreCounts(databases);
        }

        async loadStoreCounts(databases) {
            for (let dbIndex = 0; dbIndex < databases.length; dbIndex++) {
                const db = databases[dbIndex];
                for (let storeIndex = 0; storeIndex < db.stores.length; storeIndex++) {
                    const store = db.stores[storeIndex];
                    try {
                        const count = await this.viewer.getStoreCount(db.name, store.name);
                        store.count = count;
                        const countElement = this.content.querySelector(
                            `[data-db="${dbIndex}"][data-store="${storeIndex}"] .idb-viewer-tree-item-count`
                        );
                        if (countElement) {
                            countElement.textContent = `${count} items`;
                        }
                    } catch (error) {
                        console.error(`Error loading count for ${store.name}:`, error);
                    }
                }
            }
        }

        attachDatabaseEventListeners(databases) {
            const treeItems = this.content.querySelectorAll('.idb-viewer-tree-item');
            treeItems.forEach(item => {
                const dbIndex = parseInt(item.getAttribute('data-db'));
                const storeIndex = item.getAttribute('data-store');

                if (storeIndex === null) {
                    // Database item - toggle children
                    const toggle = item.querySelector('.idb-viewer-tree-toggle');
                    if (toggle) {
                        toggle.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const children = item.nextElementSibling;
                            if (children && children.classList.contains('idb-viewer-tree-children')) {
                                const isHidden = children.style.display === 'none';
                                children.style.display = isHidden ? 'block' : 'none';
                                toggle.textContent = isHidden ? '▼' : '▶';
                            }
                        });
                    }
                } else {
                    // Store item - load data
                    item.addEventListener('click', async () => {
                        const storeIdx = parseInt(storeIndex);
                        const db = databases[dbIndex];
                        const store = db.stores[storeIdx];
                        currentDatabase = db.name;
                        currentStore = store.name;
                        await this.loadStoreData(db.name, store.name);

                        // Update active state
                        this.content.querySelectorAll('.idb-viewer-tree-item').forEach(el => {
                            el.classList.remove('active');
                        });
                        item.classList.add('active');
                    });
                }
            });
        }

        async loadStoreData(dbName, storeName) {
            try {
                const mainContent = this.content;
                mainContent.innerHTML = '<div style="padding: 15px; color: #888; text-align: center;">Loading data...</div>';

                const data = await this.viewer.getStoreDataWithKeys(dbName, storeName, 1000);
                allData = data;
                filteredData = [...data];
                this.viewer.currentSearch = '';
                this.panel.querySelector('.idb-viewer-search-input').value = '';

                if (data.length === 0) {
                    mainContent.innerHTML = `<div style="padding: 15px; color: #888;">No data in this store.</div>`;
                    return;
                }

                this.renderStoreData(data);
            } catch (error) {
                this.content.innerHTML = `<div style="padding: 15px; color: #ff6b6b;">Error: ${error.message}</div>`;
            }
        }

        renderStoreData(data) {
            const mainContent = this.content;
            let html = '';

            if (data.length === 0) {
                html = '<div style="padding: 15px; color: #888;">No data to display.</div>';
            } else {
                // Check if data is key-value pairs
                const hasKeys = data[0] && data[0].key !== undefined;

                if (hasKeys) {
                    html = '<table class="idb-viewer-data-table"><thead><tr><th>Key</th><th>Value Preview</th><th>Action</th></tr></thead><tbody>';
                    data.forEach((item, index) => {
                        const valuePreview = this.getValuePreview(item.value);
                        const keyDisplay = this.escapeHtml(String(item.key));
                        html += `
                            <tr>
                                <td>${keyDisplay}</td>
                                <td>${valuePreview}</td>
                                <td><span class="idb-viewer-view-btn" style="cursor: pointer; color: #4db8ff;" data-index="${index}">View</span></td>
                            </tr>
                        `;
                    });
                    html += '</tbody></table>';
                } else {
                    // Raw data view
                    html = '<table class="idb-viewer-data-table"><thead><tr><th>Index</th><th>Value Preview</th><th>Action</th></tr></thead><tbody>';
                    data.forEach((item, index) => {
                        const valuePreview = this.getValuePreview(item);
                        html += `
                            <tr>
                                <td>${index}</td>
                                <td>${valuePreview}</td>
                                <td><span class="idb-viewer-view-btn" style="cursor: pointer; color: #4db8ff;" data-index="${index}">View</span></td>
                            </tr>
                        `;
                    });
                    html += '</tbody></table>';
                }
            }

            mainContent.innerHTML = html;

            // Attach view button listeners
            mainContent.querySelectorAll('.idb-viewer-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.getAttribute('data-index'));
                    this.showDetailView(filteredData[index]);
                });
            });
        }

        getValuePreview(value) {
            if (value === null || value === undefined) {
                return '<span style="color: #999;">' + String(value) + '</span>';
            }
            if (typeof value === 'object') {
                try {
                    const json = JSON.stringify(value);
                    if (json.length > 100) {
                        return this.escapeHtml(json.substring(0, 97) + '...');
                    }
                    return this.escapeHtml(json);
                } catch (e) {
                    return '<span style="color: #999;">Object</span>';
                }
            }
            const str = String(value);
            if (str.length > 100) {
                return this.escapeHtml(str.substring(0, 97) + '...');
            }
            return this.escapeHtml(str);
        }

        showDetailView(item) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2147483648;
            `;

            const hasKey = item.key !== undefined;
            const value = hasKey ? item.value : item;
            const json = JSON.stringify(value, null, 2);

            modal.innerHTML = `
                <div style="
                    background: #1e1e1e;
                    border: 1px solid #404040;
                    border-radius: 8px;
                    width: 80%;
                    height: 80%;
                    display: flex;
                    flex-direction: column;
                    color: #e0e0e0;
                ">
                    <div style="
                        background: #252525;
                        border-bottom: 1px solid #404040;
                        padding: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="font-weight: 600; color: #4db8ff;">
                            ${hasKey ? 'Key: ' + this.escapeHtml(String(item.key)) : 'Data Details'}
                        </div>
                        <button style="
                            background: #2a2a2a;
                            border: 1px solid #404040;
                            border-radius: 4px;
                            color: #e0e0e0;
                            cursor: pointer;
                            padding: 4px 8px;
                            font-size: 12px;
                        ">Close</button>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 15px;">
                        <pre class="idb-viewer-json">${this.escapeHtml(json)}</pre>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.querySelector('button').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        filterData(query) {
            this.viewer.currentSearch = query.toLowerCase();
            if (!query.trim()) {
                filteredData = [...allData];
            } else {
                filteredData = allData.filter(item => {
                    const hasKey = item.key !== undefined;
                    const key = hasKey ? String(item.key).toLowerCase() : '';
                    const value = hasKey ? item.value : item;
                    const valueStr = JSON.stringify(value).toLowerCase();
                    return key.includes(this.viewer.currentSearch) || valueStr.includes(this.viewer.currentSearch);
                });
            }
            this.renderStoreData(filteredData);
        }

        handleExportDatabase() {
            if (!currentDatabase) {
                alert('Please select a database first');
                return;
            }
            this.viewer.exportDatabase(currentDatabase);
        }

        handleExportStore() {
            if (!currentDatabase || !currentStore) {
                alert('Please select a store first');
                return;
            }
            this.viewer.exportStore(currentDatabase, currentStore, filteredData);
        }

        escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }
    }

    // Initialize on page load
    window.addEventListener('load', async () => {
        setTimeout(() => {
            const viewer = new IndexedDBViewer();
            const ui = new ViewerUI(viewer);
            viewer.initialize();
            ui.loadDatabases();
        }, 100);
    });
})();
