// ==UserScript==
// @name         Hide Threads + Tab
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Ukrywanie wątków + zakładka "Ukryte wątki"
// @author       jakub915
// @match        https://sexforum.pl/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/jakub915/sf-tampermonkey-scripts/refs/heads/main/hideThreads.js
// @updateURL    https://raw.githubusercontent.com/jakub915/sf-tampermonkey-scripts/refs/heads/main/hideThreads.js
// ==/UserScript==

'use strict';

const HIDDEN_THREADS_KEY = 'sf-hidden-threads';
const LINK_MATCHER = /\/threads\/[^\/]+?\.(\d+)(?:\/page-\d+)?(?=\/|$)/;

function loadHidden() {
    try {
        return JSON.parse(localStorage.getItem(HIDDEN_THREADS_KEY) || '[]');
    } catch (e) {
        console.error('sf: loadHidden', e);
        return [];
    }
}
function saveHidden(list) {
    try {
        localStorage.setItem(HIDDEN_THREADS_KEY, JSON.stringify(list));
    } catch (e) {
        console.error('sf: saveHidden', e);
    }
}

let hiddenTopics = loadHidden();

function getThreadId(item) {
    const link = item.querySelector('.structItem-title a[href*="/threads/"]');
    if (!link || !link.href) return null;
    const m = link.href.match(LINK_MATCHER);
    return m ? m[1] : null;
}

function hideSavedThreads() {
    document.querySelectorAll('.structItem--thread').forEach(item => {
        const id = getThreadId(item);
        if (id && hiddenTopics.find(t => t.id === id)) {
            item.style.display = 'none';
        }
    });
}

function addHideButtons() {
    document.querySelectorAll('.structItem--thread').forEach(item => {
        const id = getThreadId(item);
        if (!id || hiddenTopics.find(t => t.id === id)) return;
        if (item.querySelector('.sf-hide-btn')) return;

        const btn = document.createElement('button');
        btn.textContent = 'Ukryj';
        btn.className = 'sf-hide-btn';
        Object.assign(btn.style, {
            padding: '2px 6px',
            fontSize: '12px',
            backgroundColor: '#fff',
            color: '#ef4444',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const titleEl = item.querySelector('.structItem-title a');
            const title = titleEl ? titleEl.textContent.trim() : 'Nieznany tytuł';
            const url   = titleEl ? titleEl.href : window.location.href;
            const now   = new Date().toISOString();
            hiddenTopics.push({ id, title, url, dateAdded: now });
            saveHidden(hiddenTopics);
            item.style.display = 'none';
        });

        const parts = item.querySelector('ul.structItem-parts');
        if (parts) {
            const li = document.createElement('li');
            li.appendChild(btn);
            parts.insertBefore(li, parts.firstElementChild);
        }
    });
}

function createBackdrop() {
    const existing = document.querySelector('.sf-modal-backdrop');
    if (existing) existing.remove();
    const backdrop = document.createElement('div');
    backdrop.className = 'sf-modal-backdrop';
    Object.assign(backdrop.style, {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999
    });
    backdrop.addEventListener('click', () => {
        backdrop.remove();
        const ov = document.querySelector('.sf-overlay');
        if (ov) ov.remove();
    });
    document.body.appendChild(backdrop);
    return backdrop;
}

function createCloseButton(overlay, backdrop) {
    const btn = document.createElement('span');
    btn.textContent = '×';
    Object.assign(btn.style, {
        cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', color: '#374151'
    });
    btn.addEventListener('click', () => {
        overlay.remove();
        backdrop.remove();
    });
    return btn;
}

function createOverlay(titleText, content) {
    const backdrop = createBackdrop();

    const ov = document.createElement('div');
    ov.className = 'sf-overlay';
    Object.assign(ov.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw', height: '80vh', overflowY: 'auto',
        backgroundColor: '#fff', padding: '20px',
        borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px'
    });
    const h3 = document.createElement('h3');
    h3.textContent = titleText;
    header.appendChild(h3);
    header.appendChild(createCloseButton(ov, backdrop));

    ov.appendChild(header);
    ov.appendChild(content);
    document.body.appendChild(ov);
    return ov;
}

function createOverlayListContent() {
    const container = document.createElement('div');
    if (hiddenTopics.length === 0) {
        const msg = document.createElement('div');
        msg.textContent = 'Brak ukrytych wątków';
        msg.style.textAlign = 'center';
        container.appendChild(msg);
        return container;
    }
    hiddenTopics.forEach(t => {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' });
        const link = document.createElement('a');
        link.href = t.url;
        link.textContent = t.title;
        link.target = '_blank';
        row.appendChild(link);

        const btn = document.createElement('button');
        btn.textContent = 'Przywróć';
        Object.assign(btn.style, {
            marginLeft: '10px', padding: '2px 6px',
            backgroundColor: '#3B82F6', color: '#fff', border: 'none',
            borderRadius: '4px', cursor: 'pointer'
        });
        btn.addEventListener('click', () => {
            hiddenTopics = hiddenTopics.filter(x => x.id !== t.id);
            saveHidden(hiddenTopics);
            row.remove();
        });
        row.appendChild(btn);

        container.appendChild(row);
    });
    return container;
}

function showHiddenThreadsOverlay(e) {
    e.preventDefault();
    const content = createOverlayListContent();
    createOverlay('Ukryte wątki', content);
}

function addHiddenThreadsTab() {
    const navList = document.querySelector('.p-nav-list');
    if (!navList || document.getElementById('hiddenThreadsBtn')) return;
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="p-navEl">
            <a href="#" class="p-navEl-link" id="hiddenThreadsBtn">Ukryte wątki</a>
        </div>`;
    navList.appendChild(li);
    document.getElementById('hiddenThreadsBtn').addEventListener('click', showHiddenThreadsOverlay);
}

window.addEventListener('load', () => {
    hideSavedThreads();
    addHiddenThreadsTab();
    addHideButtons();
});
