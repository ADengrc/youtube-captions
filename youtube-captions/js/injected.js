xhook.after(function (request, response) {
    let url = request.url
    if (url.includes('/api/timedtext')) {
        const zhReg = /^zh-\w+/
        const params = new URLSearchParams(url)
        let lang = (params.get('lang') || '').toLocaleLowerCase()
        let tlang = (params.get('tlang') || '').toLocaleLowerCase()
        
        if (!zhReg.test(lang) && !zhReg.test(tlang)) {
            let userLang
            try {
                JSON.parse(ytplayer.config.args.player_response).captions.playerCaptionsTracklistRenderer.captionTracks.forEach(lang => {
                    lang.languageCode = lang.languageCode.toLocaleLowerCase()
                    if (userLang && userLang.languageCode == 'zh-cn') return
                    if (zhReg.test(lang.languageCode)) {
                        lang.baseUrl += '&fmt=srv3'
                        userLang = lang
                    }
                })
            } catch (error) {
                console.log(error)
            }

            let xhr = new XMLHttpRequest();
            xhr.open('GET', userLang ? userLang.baseUrl : `${url}&tlang=zh-Hans`, false);
            xhr.send();

            xhr.responseXML.querySelectorAll('p').forEach(e => {
                let p = response.xml.querySelector(`p[t='${e.getAttribute('t')}']`);
                if (p) {
                    if (p.childElementCount && e.previousElementSibling) {
                        let previous = e.previousElementSibling;
                        previous.setAttribute('d', e.getAttribute('t') - previous.getAttribute('t'));
                    }

                    e.textContent = [p.textContent.replace('\n', ' '), e.textContent.replace('\n', ' ')].join('\n');
                }
            });

            response.text = new XMLSerializer().serializeToString(xhr.responseXML);
        }
    }
});
