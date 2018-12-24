/**
 * _hookAjax 引用自 https://github.com/wendux/Ajax-hook
 * @param {*} proxy 
 */
function _hookAjax(proxy) {
    window._ahrealxhr = window._ahrealxhr || XMLHttpRequest
    XMLHttpRequest = function () {
        this.xhr = new window._ahrealxhr;
        for (var attr in this.xhr) {
            var type = "";
            try {
                type = typeof this.xhr[attr]
            } catch (e) {}
            if (type === "function") {
                this[attr] = hookfun(attr);
            } else {
                Object.defineProperty(this, attr, {
                    get: getFactory(attr),
                    set: setFactory(attr)
                })
            }
        }
    }

    function getFactory(attr) {
        return function () {
            var v = this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
            var attrGetterHook = (proxy[attr] || {})["getter"]
            return attrGetterHook && attrGetterHook(v, this) || v
        }
    }

    function setFactory(attr) {
        return function (v) {
            var xhr = this.xhr;
            var that = this;
            var hook = proxy[attr];
            if (typeof hook === "function") {
                xhr[attr] = function () {
                    proxy[attr](that) || v.apply(xhr, arguments);
                }
            } else {
                //If the attribute isn't writeable, generate proxy attribute
                var attrSetterHook = (hook || {})["setter"];
                v = attrSetterHook && attrSetterHook(v, that) || v
                try {
                    xhr[attr] = v;
                } catch (e) {
                    this[attr + "_"] = v;
                }
            }
        }
    }

    function hookfun(fun) {
        return function () {
            var args = [].slice.call(arguments)
            if (proxy[fun] && proxy[fun].call(this, args, this.xhr)) {
                return;
            }
            return this.xhr[fun].apply(this.xhr, args);
        }
    }
}
function bodyHandle(caption, map) {
    let body = caption.querySelector('body')
    let l = body.children.length
    while (l--) {
        let node = body.children[l]
        if (node.tagName === 'p') {
            let key = [node.getAttribute('t'), node.getAttribute('d')].join('_')
            let j = node.children.length
            if (j === 0) {
                map[key] = node.innerHTML
            } else {
                let nodeText = []
                while (j--) {
                    let childNode = node.children[j]
                    if (childNode.tagName === 's' && childNode.innerHTML.trim()) {
                        nodeText.unshift(childNode.innerHTML)
                    }
                }
                map[key] = nodeText.join(' ')
            }
        }
    }
}
function getParams(url = '', key) {
    let reg = new RegExp('(/?|&)' + key + '=([^&]*)(&|$)', 'i')
    let res = url.match(reg)
    return res ? unescape(res[2]) : null
}
function getCaption(url, lang) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', `${url}&tlang=${lang}`, false)
    xhr.send()
    return new DOMParser().parseFromString(xhr.responseText, 'text/xml')
}
function responseTextGetter(captionXml,xhr){
    let url = xhr.responseURL
    if (~url.indexOf('/api/timedtext') && !getParams(url, 'tlang')) {
        try {
            let caption_1 = new DOMParser().parseFromString(captionXml, 'text/xml')
            let caption_2 = getCaption(url, 'zh-Hans')
            let map_1 = {}
            let map_2 = {}
            bodyHandle(caption_1, map_1)
            bodyHandle(caption_2, map_2)
            let body_2 = caption_2.querySelector('body')
            let l = body_2.children.length
            while (l--) {
                let node = body_2.children[l]
                if (node.tagName === 'p') {
                    let key = [node.getAttribute('t'), node.getAttribute('d')].join('_')
                    node.innerHTML = [map_1[key], map_2[key]].join('\n')
                }
            }
            return new XMLSerializer().serializeToString(caption_2)
        } catch (error) {
            console.error(error)
            return captionXml
        }
    }
    return captionXml
}
_hookAjax({
    responseText: {
        getter: responseTextGetter
    }
})