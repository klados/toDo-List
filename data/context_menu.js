
  self.on("click",function(){
    var t = window.getSelection();
    self.postMessage(t.toString());
  });
