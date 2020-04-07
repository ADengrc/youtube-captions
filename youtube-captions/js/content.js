chrome.storage.sync.get('open', (storage) => {
  if (storage.open && ['www.youtube.com'].includes(document.domain)) {
    let xHook = chrome.extension.getURL('js/xhook.min.js');
    if (!document.head.querySelector(`script[src='${xHook}']`)) {
      function injectJs(src) {
        let script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
        return script;
      }

      injectJs(xHook).onload = function () {
        this.onload = null;
        injectJs(chrome.extension.getURL('js/injected.js'));
      };
    }
  }
});
