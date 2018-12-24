var s = document.createElement('script');
s.src = chrome.extension.getURL('src/js/injected.js');
(document.head || document.documentElement).appendChild(s);