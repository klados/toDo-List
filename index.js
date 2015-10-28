/*
 jpm init : to initialize an empty add-on template
 jpm  -b /bin/firefox run : to run a new instance of Firefox with the add-on installed, so we can try it out
 jpm  -b /bin/firefox run --profile ~/addon-dev/profiles/boogaloo
 jpm xpi : to package the add-on into an XPI file for distribution
*/

var {ToggleButton} = require("sdk/ui/button/toggle"); //low level API
var panels = require("sdk/panel");
var ss = require("sdk/simple-storage");
var pref = require("sdk/simple-prefs");
var cm = require("sdk/context-menu");
var clipboard = require("sdk/clipboard");

var button = ToggleButton({//button
  id:"test_button",
  label:"toDo list",
  icon:{
    "16": "./check-16.png",
    "32": "./check-32.png",
    "64": "./check-64.png"
  },
  badge:0,
  onChange: clickFunction
});

var panel = panels.Panel({//panel
  width:350,
  height:430,
  onHide: hideHandler,
  contextMenu: true,
  contentURL:"./panel.html",
  contentScriptFile:[require("sdk/self").data.url("./bower_components/jquery.js"),"./bower_components/jquery-ui.min.js" ,"./autolink.js",require("sdk/self").data.url("./contentScript.js")] //["./contentScript.js" ]
});

var item = cm.Item({
  label:"Add to the List",
  data:"item_id",
  image: require("sdk/self").data.url("./check-16.png"),
  context: cm.SelectionContext(),
  contentScriptFile:[require("sdk/self").data.url("./bower_components/jquery.js"),"./bower_components/jquery-ui.min.js","./autolink.js", "./context_menu.js"],
  onMessage: function (selectionText) {
     button.badge += 1;
     panel.port.emit("contex_item", selectionText );
  }
});


pref.on("bc",function(name){ //background-color
  panel.port.emit("bc",pref.prefs[name]);
  ss.storage.pref[0] = pref.prefs[name];
});

pref.on("ic",function(name){//item color
  panel.port.emit("ic",pref.prefs[name]);
  ss.storage.pref[1] = pref.prefs[name];
});

pref.on("btn",function(name){ //settings button
  panel.port.emit("btn");
  pref.prefs["bc"] = "#6692A5";
  pref.prefs["ic"] = "#F0FFFF";
  ss.storage.pref[0] = "#6692A5";
  ss.storage.pref[1] = "#F0FFFF";
});

pref.on("clear_btn",function(name){ //remove all the data from the arrays
    panel.port.emit("clear data");
    ss.storage.tasks = [];
    ss.storage.through_tasks = [];
    button.badge = 0;
});

panel.port.on("addTask",function(t){
    ss.storage.tasks.push(t);
    ss.storage.through_tasks.push(false);
    //console.log("add array: " + ss.storage.tasks +" & "+ss.storage.through_tasks);
});

panel.port.on("deleteTask",function(t){
  var index =  ss.storage.tasks.indexOf(t);
    if(index > -1){
      ss.storage.tasks.splice(index,1);
      ss.storage.through_tasks.splice(index,1);
    }
  //console.log("delete task from array: "+ ss.storage.tasks+ " "+ss.storage.through_tasks);
});

panel.port.on('decrease_badge',function(){
  button.badge -= 1;
});

panel.port.on('increase_badge',function(){
  button.badge += 1;
});

panel.port.on("line-through_update",function(t){ //όσα έχουν διαγραφεί αποθηκεύονται
  var index = ss.storage.tasks.indexOf(t);
  ss.storage.through_tasks[index] = true;
  //console.log("array: " + ss.storage.tasks+" & "+ss.storage.through_tasks);
});


panel.port.on("clipboard",function(text){ //copy to clipboard
    clipboard.set(text);
});

panel.port.on("modify task",function(arg){
  var index = ss.storage.tasks.indexOf(arg.old);//index in the array of the old value

  if(arg.through == true){ //text and line-through
    ss.storage.through_tasks[index] = false;
  }

  ss.storage.tasks[index]  = arg.new;
  //console.log(ss.storage.tasks + "\n" +ss.storage.through_tasks);
});

panel.port.on("sortover",function(pos){ //swap the value of the old position with the new one
  var temp = ss.storage.tasks[pos.old];
  var temp1 = ss.storage.through_tasks[pos.old];

  ss.storage.tasks.splice(pos.old,1); //remove old value
  ss.storage.through_tasks.splice(pos.old,1); //remove old value

  ss.storage.tasks.splice(pos.new,0,temp);
  ss.storage.through_tasks.splice(pos.new,0,temp1);

  //console.log("sort: "+ss.storage.tasks+" & "+ ss.storage.through_tasks);
});

//------ function area --------
function init(){
  // ss.storage.tasks = ["hahaha"];
  // ss.storage.through_tasks = [false];

  if(!ss.storage.tasks || !ss.storage.tasks){
    ss.storage.tasks = [];
    ss.storage.through_tasks = [];
  }

  if(!ss.storage.pref){
   ss.storage.pref = [];
   ss.storage.pref.push( "#6692A5" );
  //  ss.storage.pref.push( "image" );
   ss.storage.pref.push( "#F0FFFF" );
  }

  panel.port.emit("bc", ss.storage.pref[0] ); //send the colors
  panel.port.emit("ic", ss.storage.pref[1] );

  button.badge +=  ss.storage.tasks.length;
  panel.port.emit('init_array',ss.storage.tasks); //στείλε το περιεχόμενο του πίνακα που έχει αποθηκευτεί
  panel.port.emit("line-through_update" , ss.storage.through_tasks);
}
init();

function clickFunction(state){
  if(state.checked){
    panel.show({position:button});
  }
}

function hideHandler(){
  button.state("window",{checked:false});
}
