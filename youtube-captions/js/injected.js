window.fetch = xhook.fetch;
const mergerSegs = function (segs, event, map) {
  if (segs) {
    let utf8 = segs.map((seg) => seg.utf8).join("");
    let val = map && map.get(`${event.tStartMs}_${event.dDurationMs}`);
    if (val) {
      utf8 = `${val[0].utf8}\n${utf8}`;
    }
    return [
      {
        utf8,
      },
    ];
  } else {
    return [
      {
        utf8: "",
      },
    ];
  }
};

const setMap = function (userLang, url) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", userLang ? userLang.baseUrl : `${url}&tlang=zh-Hans`, false);
  xhr.send();
  let map = new Map();
  JSON.parse(xhr.response).events.forEach((event) => {
    if (event.segs) {
      map.set(`${event.tStartMs}_${event.dDurationMs}`, mergerSegs(event.segs));
    }
  });
  return map;
};

const processEvents = function (events) {
  let map = new Map();
  let pre = null;
  events.forEach((e) => {
    if (e.segs && e.segs.length > 0) {
      if (!pre) pre = e;
      if (!e.aAppend && e.tStartMs >= pre.tStartMs + pre.dDurationMs) {
        pre = e;
      }
      e.segs = [{ utf8: e.segs.map((seg) => seg.utf8).join("") }];
      let cc = map.get(pre.tStartMs);
      if (!cc) {
        cc = [];
      }
      cc.push(e);
      map.set(pre.tStartMs, cc);
    }
  });
  events = [];
  map.forEach((e) => {
    events.push(
      Object.assign({}, e[0], {
        segs: [
          {
            utf8: e
              .map((c) => c.segs[0].utf8)
              .join("")
              .replace(/\n/g, " "),
          },
        ],
      })
    );
  });
  return events;
};

let getResult = function (response, map) {
  let resJson = JSON.parse(response.text);
  resJson.events = processEvents(resJson.events);
  let events = [];
  resJson.events.forEach(function (event) {
    delete event.wWinId;
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

// let injectedStyle = function() {
//   let style = document.createElement("style");
//   style.innerText =
//     ".caption-window.ytp-caption-window-bottom{transform:scale(2) translateY(-30%)}";
//   document.head.appendChild(style);
// };
// injectedStyle();

xhook.after(function (request, response) {
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
          (lang) => {
            lang.languageCode = lang.languageCode.toLocaleLowerCase();
            if (userLang && userLang.languageCode == "zh-cn") return;
            if (zhReg.test(lang.languageCode)) {
              lang.baseUrl += "&fmt=json3";
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
