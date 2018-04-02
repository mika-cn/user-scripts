// ==UserScript==
// @name     colorDate
// @description "Set date color according to date"
// @version  1
// @grant    none
// @author   mika
// ==/UserScript==

function getTextNodeIterator(){
  return document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_TEXT, function(node) {
      if(['script', 'style', 'datespan'].indexOf(node.parentNode.nodeName.toLowerCase()) > -1){
        return NodeFilter.FILTER_REJECT;
      }else{
        return NodeFilter.FILTER_ACCEPT;
      }
    }
 );
}



function getMatchNode(){
  var part = [];
  var currentNode;
  var nodeIterator = getTextNodeIterator();
  while (currentNode = nodeIterator.nextNode()) {
    var v = currentNode.nodeValue;
    var rule = rules.some(function(rule){
      return !!v.match(rule.regExp)
    });
    if(rule){
      part.push(currentNode)
    }
  }
  return part
}

var day  = 24 * 60 * 60 * 1000;
var year = 365 * day;


var colors = [
  {color: "#ff0000", threshold: 5 * year},
  {color: "#ff5f00", threshold: 3 * year},
  {color: "#d700ff", threshold: 1 * year},
  {color: "#8700ff", threshold: 183 * day},
  {color: "#00af00", threshold: 7 * day},
  {color: "#00d700", threshold: 1 * day},
]

var rules = [
  {key: "regExp_01", regExp: /\d{4}-[0,1]?\d-[0-3]?\d/g},
  {key: "regExp_02", regExp: /\d{4}\/[0,1]?\d\/[0-3]?\d/g},
//  {key: "regExp_03", regExp: /(\d{4}-[0,1]?\d)[^-]*/g},
//  {key: "regExp_04", regExp: /(\d{4}\/[0,1]?\d)[^\/]*/g},
  {key: "regExp_05", regExp: /[0,1]{1}\d-[0-3]{1}\d/g},
  {key: "regExp_06", regExp: /(?:Jan|jan|Feb|feb|Mar|mar|Apr|apr|May|may|Jun|jun|Jul|jul|Aug|aug|Sep|sep|Oct|oct|Nov|nov|Dec|dec) [0-3]?\d[,\s]{1}\s?\d{4}/},

  {key: "regExp_11", regExp: /\d{4}年[0,1]?\d月[0-3]?\d日/g},
  {key: "regExp_13", regExp: /\d{4}年[0,1]?\d月/g},
  {key: "regExp_15", regExp: /[0,1]?\d月[0-3]?\d日/g},
]

function getReplace(key){

  var group_01 = ["regExp_01", "regExp_02", "regExp_06", "regExp_11"]
  var group_02 = ["regExp_03", "regExp_04", "regExp_13"]
  var group_03 = ["regExp_05", "regExp_15"]

  if(group_01.indexOf(key) > -1){
    return function(match){
      var dateStr = match.replace(/年|月/g, '-').replace("日", '');
      return replace(match, dateStr)
    }
  }

  if(group_02.indexOf(key) > -1){
    return function(match){
      var dateStr = match.replace(/年|\//g, '-').replace("月", '') + "-01";
      return replace(match, dateStr)
    }
  }

  if(group_03.indexOf(key) > -1){
    return function(match){
      var dateStr = (new Date()).getFullYear().toString() + "-" + match.replace(/月/g, '-').replace("日", '');
      return replace(match, dateStr)
    }
  }
}

function replace(match, dateStr){
  try{
    var result = match;
    var diff = Date.now() - Date.parse(dateStr);
    colors.some(function(item){
      if(diff >= item.threshold){
        result = "<datespan style='color:"+ item.color +";'>" + match +"</datespan>";
        return true
      }
      return false
    })
    return result;
  }catch(e){
    return match;
  }
}


function colorDate(){
  nodes = getMatchNode();
  nodes.forEach(function(node){
    // replace child node
    var newNode = document.createElement("span");
    var html = node.nodeValue;
    rules.forEach(function(rule){
      var match = html.match(rule.regExp);
      if(match){
        html = html.replace(rule.regExp, getReplace(rule.key))
      }
    })
    newNode.innerHTML = html
    node.parentNode.replaceChild(newNode, node)
  })
}

setTimeout(colorDate, 500);
setTimeout(colorDate, 2000);
setTimeout(colorDate, 6000);
