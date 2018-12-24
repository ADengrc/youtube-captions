function open() {
    chrome.storage.sync.set({
        open: true
    }, () => {
        chrome.browserAction.setBadgeText({
            text: 'ON'
        })
        chrome.notifications.create(null, {
            type: "basic",
            iconUrl: 'src/images/icon.png',
            title: 'YouTube™双字幕',
            message: '已开启'
        })
        chrome.tabs.reload()
    })
}

function close() {
    chrome.storage.sync.set({
        open: false
    }, () => {
        chrome.browserAction.setBadgeText({
            text: 'OFF'
        })
        chrome.notifications.create(null, {
            type: "basic",
            iconUrl: 'src/images/icon.png',
            title: 'YouTube™双字幕',
            message: '已关闭'
        })
        chrome.tabs.reload()
    })
}
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        open: false
    }, () => {
        chrome.browserAction.setBadgeText({
            text: 'OFF'
        })
    })
})
chrome.browserAction.onClicked.addListener(() => {
    chrome.storage.sync.get('open', (res) => {
        res.open ? close() : open()
    })
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        if (~tab.url.indexOf('youtube.com')) {
            chrome.storage.sync.get('open', res => {
                res.open && chrome.tabs.executeScript(tabId, {
                    file: 'src/js/content.js',
                    runAt: 'document_start',
                })
            })

        }
    }
})