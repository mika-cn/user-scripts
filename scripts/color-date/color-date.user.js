// ==UserScript==
// @name     colorDate
// @namespace https://github.com/mika-cn/user-scripts
// @description "Set date color according to date 根据网页上日期的新旧程度， 给日期进行着色， 比如说已经是5年前的一个日期会成为红色， 以便提醒阅览者，注意信息可能过于陈旧。"
// @version  1.0.9
// @grant    none
// @include *
// @author   mika
// ==/UserScript==

(function(){
  'use strict';

  /*
   * 获取文本节点迭代器
   */
  function getTextNodeIterator(){
    return document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_TEXT, function(node) {
        if(['script', 'style', 'datetext', 'datespan'].indexOf(node.parentNode.nodeName.toLowerCase()) > -1){
          return NodeFilter.FILTER_REJECT;
        }else{
          return NodeFilter.FILTER_ACCEPT;
        }
      }
   );
  }


  /*
   * 根据规则(判断是否是日期)，获取满足的节点
   */
  function getMatchNode(){
    var nodes = [];
    var currentNode;
    var nodeIterator = getTextNodeIterator();
    while (currentNode = nodeIterator.nextNode()) {
      var v = currentNode.nodeValue;
      var rule = rules.some(function(rule){
        return !!v.match(rule.regExp);
      });

      if(rule){
        nodes.push(currentNode);
      }
    }
    return nodes;
  }

  /*
   * 时长阀值与色值
   */
  var day  = 24 * 60 * 60 * 1000;
  var year = 365 * day;
  var colors = [
    {color: "#ff0000", threshold: 5 * year},
    {color: "#ff5f00", threshold: 3 * year},
    {color: "#d700ff", threshold: 1 * year},
    {color: "#8700ff", threshold: 183 * day},
    {color: "#00af00", threshold: 7 * day},
    {color: "#00d700", threshold: 1 * day},
  ];


  var monthPart = (`
    Jan|January|
    Feb|February|
    Mar|March|
    Apr|April|
    May|
    Jun|June|
    Jul|July|
    Aug|Augest|
    Sep|Sept|September|
    Oct|October|
    Nov|November|
    Dec|December
  `).replace(/\n\s*/gm, '');

  /*
   * 判断规则
   */
  var rules = [
    {key: "01", regExp: /\d{4}-[0,1]?\d-[0-3]?\d/g},
    {key: "01", regExp: /\d{4}\/[0,1]?\d\/[0-3]?\d/g},
    {key: "02", regExp: /(\d{4}-[0,1]?\d)[^-]*/g},
    {key: "02", regExp: /(\d{4}\/[0,1]?\d)[^\/]*/g},
    {key: "03", regExp: /[0,1]{1}\d-[0-3]{1}\d/g},
    {key: "01", regExp: new RegExp("(?:"+ monthPart +") [0-3]?\\d[,\\s]{1}\\s?\\d{4}", 'igm')},
    {key: "01", regExp: /\d{4}年[0,1]?\d月[0-3]?\d日/g},
    {key: "02", regExp: /\d{4}年[0,1]?\d月/g},
    {key: "03", regExp: /[0,1]?\d月[0-3]?\d日/g},
    {key: "04", regExp: /\d+\s?天前/mg},
    {key: "04", regExp: /\d+\s?days?\sago/mg},
    {key: "05", regExp: /\d+\s?月前/mg},
    {key: "05", regExp: /\d+\s?months?\sago/mg},
    {key: "06", regExp: new RegExp("(?:"+ monthPart +")['\\s]{1}[0-3]?\\d", 'igm')},
    {key: "07", regExp: /\d+\s?年前/mg},
    {key: "07", regExp: /\d+\s?years?\sago/mg},
  ];

  /*
   * 根据不同的正则，返回处理函数
   */
  function getHandler(key){
    switch(key){
      case "01" : return handler_01();
      case "02" : return handler_02();
      case "03" : return handler_03();
      case "04" : return handler_04();
      case "05" : return handler_05();
      case "06" : return handler_06();
      case "07" : return handler_07();
      default: return function(match){ return match;};
    }
  }

  function handler_01(){
    return function(match){
      var dateStr = match.replace(/年|月/g, '-').replace("日", '');
      return replace(match, dateStr);
    };
  }

  function handler_02(){
    return function(match){
      var dateStr = match.replace(/年|\//g, '-').replace("月", '') + "-01";
      return replace(match, dateStr);
    };
  }

  function handler_03(){
    return function(match){
      var dateStr = (new Date()).getFullYear().toString() + "-" + match.replace(/月/g, '-').replace("日", '');
      return replace(match, dateStr);
    };
  }

  function handler_04(){
    return function(match){
      var n = parseInt(match.match(/\d+/)[0]);
      return replace(match, (new Date() - n * day));
    };
  }

  function handler_05(){
    return function(match){
      var n = parseInt(match.match(/\d+/)[0]);
      return replace(match, (new Date() - n * 30 * day));
    };
  }

  function handler_06(){
    return function(match){
      return replace(match, match.replace(/'/, ' ') + " " + (new Date()).getFullYear().toString());
    };
  }


  function handler_07(){
    return function(match){
      var n = parseInt(match.match(/\d+/)[0]);
      return replace(match, (new Date() - n * 365 * day));
    };
  }


  /*
   * 处理函数, 根据时长阀值着色
   */
  function replace(match, dateStr){
    try{
      var result = match;
      var diff = Date.now() - new Date(dateStr);
      colors.some(function(item){
        if(diff >= item.threshold){
          result = "<datespan style='color:"+ item.color +";'>" + match +"</datespan>";
          return true;
        }
        return false;
      });
      return result;
    }catch(e){
      return match;
    }
  }


  // 主函数
  function colorDate(){
    var nodes = getMatchNode();
    nodes.forEach(function(node){
      // replace child node
      var newNode = document.createElement("datetext");
      var html = node.nodeValue;
      rules.forEach(function(rule){
        var match = html.match(rule.regExp);
        if(match){
          html = html.replace(rule.regExp, getHandler(rule.key));
        }
      });
      newNode.innerHTML = html;
      node.parentNode.replaceChild(newNode, node);
    });
  }



  /*
   * 创建延迟调用对象
   * 用来防止短时间内被调用多次
   */
  var createDelayCall = function(fn, delay){
    var dc = {};
    dc.action = fn;
    dc.clearTimeout = function(){
      if(dc.timeoutId){
        clearTimeout(dc.timeoutId);
      }
    };
    dc.run = function(){
      dc.clearTimeout();
      dc.timeoutId = setTimeout(function(){
        dc.action();
        dc.clearTimeout();
      }, delay);
    };
    return dc;
  };

  /*
   * 判断变更是否来自脚本
   */
  function isColorDateMotation(mutationRecords){
    return mutationRecords.every(function(record){
      return record.type === "childList" && record.addedNodes.length > 0 && record.addedNodes[0].nodeName.toLowerCase() === "datetext";
    });
  }

  var delayColorDate = createDelayCall(colorDate, 400);

  /*
   * 初始化 mutationObserver
   */
  function initMutationObserver(){
    var observer = new MutationObserver(function(mutationRecords){
      if(isColorDateMotation(mutationRecords)){
        // 本脚本产生的变更，不触发
        // console.log("Ignore motation")
      }else{
        delayColorDate.run();
      }
    });
    observer.observe(document, {
      attributes: false,
      childList: true,
      subtree: true
    });
    //console.log("init mutationObserver");
  }

  // 监听变更，触发着色 (适用于动态网页，如: ajax加载内容后产生变更)
  initMutationObserver();
  // 静态网页加载过程中不会产生变更, 直接调用
  setTimeout(colorDate, 400);
  setTimeout(colorDate, 1000);
  setTimeout(colorDate, 4000);

})();
