// ==UserScript==
// @name     colorDate
// @namespace https://github.com/mika-cn/user-scripts
// @description "Set date color according to date"
// @version  1.0.2
// @grant    none
// ==/UserScript==
// @author   mika
// @code     https://github.com/mika-cn/user-scripts

(function(){


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
        return !!v.match(rule.regExp)
      });
      if(rule){
        nodes.push(currentNode)
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
  ]

  /*
   * 判断规则
   */
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

  /*
   * 根据不同的正则，返回处理函数
   */
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

  /*
   * 处理函数, 根据时长阀值着色
   */
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


  // 主函数
  function colorDate(){
    //console.log("color date");
    nodes = getMatchNode();
    nodes.forEach(function(node){
      // replace child node
      var newNode = document.createElement("datetext");
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
    }
    return dc;
  }

  /*
   * 判断变更是否来自脚本
   */
  function isColorDateMotation(mutationRecords){
    return mutationRecords.every(function(record){
      return record.type === "childList" && record.addedNodes.length > 0 && record.addedNodes[0].nodeName.toLowerCase() === "datetext";
    })
  }

  var delayColorDate = createDelayCall(colorDate, 400);

  /*
   * 初始化 mutationObserver
   */
  function initMutationObserver(){
    var config = { };
    var mutated = function(mutationRecords){
      if(isColorDateMotation(mutationRecords)){
        // 本脚本产生的变更，不触发
        // console.log("Ignore motation")
      }else{
        delayColorDate.run();
      }
    }
    var observer = new MutationObserver(mutated);
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
