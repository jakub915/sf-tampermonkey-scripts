// ==UserScript==
// @name         Hide Sex Cameras & Bottom Banner
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Ukrywa "Sex kamerki" z menu oraz dolny baner
// @author       jakub915
// @match        https://sexforum.pl/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/jakub915/sf-tampermonkey-scripts/refs/heads/main/removeCamerasAndBanner.js
// @updateURL    https://raw.githubusercontent.com/jakub915/sf-tampermonkey-scripts/refs/heads/main/removeCamerasAndBanner.js
// ==/UserScript==

'use strict';

function hideSexCameras() {
    const nav = document.querySelector('ul.p-nav-list');
    if (!nav) return;
    nav.querySelectorAll('li:nth-child(5), li:nth-child(7)').forEach(li => {
        li.style.display = 'none';
    });
}

function hideBanner(selectorPath) {
    const banner = document.querySelector(selectorPath);
    if (banner) banner.remove();
}

window.addEventListener('load', () => {
    hideSexCameras();
    hideBanner('#top > div.p-body > div > div:nth-child(2)');
    hideBanner('#top > div.p-body > div > div:nth-child(7)');
    hideBanner('#top > div.p-body > div > div:nth-child(8)');
});

const observer = new MutationObserver(() => {
    hideSexCameras();
    hideBanner('#top > div.p-body > div > div:nth-child(2)');
    hideBanner('#top > div.p-body > div > div:nth-child(7)');
});
observer.observe(document.body, { childList: true, subtree: true });
