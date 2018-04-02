// ==UserScript==
// @name     WranOutdatePage
// @description "warn reader when page/article might outdate(3 years ago)."
// @version  1
// @grant    none
// @author   mika
// ==/UserScript==

function extractUrlDate(url){
  var dateRegExp_01 = /\d{4}\/[0,1]?\d\/[0-3]?\d/; /* YYYY/MM/DD */
  var dateRegExp_02 = /\d{4}-[0,1]?\d-[0-3]?\d/;   /* YYYY-MM-DD */
  var match = url.match(dateRegExp_01) || url.match(dateRegExp_02);
  return match && match[0]
}

function warnExpiredPage(url, expireThreshold){
  var dateStr = extractUrlDate(url);
  if(dateStr){
    var now = Date.now();
    var urlDate = Date.parse(dateStr);
    if(now - urlDate > expireThreshold){
      showWarnMessage(dateStr);
    }
  }
}

function showWarnMessage(dateStr){
  console.error(dateStr);
  var warn = document.createElement("div");
  var text = document.createTextNode("信息可能过旧: " + dateStr);
  warn.appendChild(text);
  warn.style = `
    background-color: #2020FF;
    color: #FFF;
    font-weight: 300px;
    position: fixed;
    padding: 2px 2px 2px 10px;
    right: 0px;
    top: 100px;
    z-index: 9999;
  `;
  document.body.appendChild(warn)
}

// millisecond
var threshold = {
     oneDay: 24 * 60 * 60 * 1000,
    oneYear: 1 * 365 * 24 * 60 * 60 * 1000,
  threeYear: 3 * 365 * 24 * 60 * 60 * 1000,
}

warnExpiredPage(document.location.href, threshold.threeYear);

/*
function test(){
  warnExpiredPage("https://github.io/blog/ruby/2010/03/28/ruby-stdin.html", threshold.threeYear);
  warnExpiredPage("https://github.io/blog/ruby/2018-03-30/ruby-stdin.html", threshold.oneYear);
  warnExpiredPage("https://github.io/blog/ruby/2016-03-31-ruby-stdin.html", threshold.oneYear);
}
test();
*/
