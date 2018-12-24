chrome.runtime.onInstalled.addListener(() => chrome.storage.sync.set({open: true}));

chrome.browserAction.onClicked.addListener(() => {
    chrome.storage.sync.get('open', res => {
        chrome.storage.sync.set({open: !res.open}, () => {
            chrome.browserAction.setIcon({path: `images/${!res.open ? 'icon128' : 'closed'}.png`});
        });
    });
    chrome.tabs.reload();
});