let mergerSegs = function(segs, event, map) {
  if (segs) {
    let utf8 = segs.map(seg => seg.utf8).join("");
    let val = map && map.get(`${event.tStartMs}_${event.dDurationMs}`);
    if (val) {
      utf8 = `${utf8}\n${val[0].utf8}`;
    }
    return [
      {
        utf8
      }
    ];
  } else {
    return [
      {
        utf8: ""
      }
    ];
  }
};

let setMap = function(userLang, url) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", userLang ? userLang.baseUrl : `${url}&tlang=zh-Hans`, false);
  xhr.send();
  let map = new Map();
  JSON.parse(xhr.response).events.forEach(event => {
    if (event.segs) {
      map.set(`${event.tStartMs}_${event.dDurationMs}`, mergerSegs(event.segs));
    }
  });
  return map;
};

let getResult = function(response, map) {
  let resJson = JSON.parse(response.text);
  let events = [];
  resJson.events.forEach(function(event) {
    if (
      !(event.segs && event.segs.length === 1 && event.segs[0].utf8 === "\n")
    ) {
      if (event && event.segs) {
        event.segs = mergerSegs(event.segs, event, map);
      }
      events.push(event);
    }
  });
  resJson.events = events;
  return JSON.stringify(resJson);
};

let injectedStyle = function() {
  let style = document.createElement("style");
  style.innerText =
    ".caption-window.ytp-caption-window-bottom{transform:scale(2) translateY(-30%)}";
  document.head.appendChild(style);
};
injectedStyle();

xhook.after(function(request, response) {
  let url = request.url;
  if (url.includes("/api/timedtext")) {
    const zhReg = /^zh-\w+/;
    const params = new URLSearchParams(url);
    let lang = (params.get("lang") || "").toLocaleLowerCase();
    let tlang = (params.get("tlang") || "").toLocaleLowerCase();

    if (!zhReg.test(lang) && !zhReg.test(tlang)) {
      let userLang;
      try {
        JSON.parse(
          ytplayer.config.args.player_response
        ).captions.playerCaptionsTracklistRenderer.captionTracks.forEach(
          lang => {
            lang.languageCode = lang.languageCode.toLocaleLowerCase();
            if (userLang && userLang.languageCode == "zh-cn") return;
            if (zhReg.test(lang.languageCode)) {
              lang.baseUrl += "&fmt=srv3";
              userLang = lang;
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
      let map = setMap(userLang, url);
      response.text = getResult(response, map);
    }
  }
});
