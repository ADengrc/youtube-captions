xhook.after(function (request, response) {
    if (request.url.includes('/api/timedtext') && !request.url.includes('&tlang=')) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `${request.url}&tlang=zh-Hans`, false);
        xhr.send();

        if (response.xml.querySelector('head pen')) {
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
        } else {
            xhr.responseXML.querySelector('body').innerHTML = response.xml.querySelector('body').innerHTML.replace(/\n/g, ' ') +
                xhr.responseXML.querySelector('body').innerHTML.replace(/\n/g, ' ');
        }

        response.text = new XMLSerializer().serializeToString(xhr.responseXML);
    }
});
