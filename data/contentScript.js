
window.onload = function(){
  //console.log("content script ready");
  var backup=""; //save the last deleted text
  $("#restore").hide();
  $("#warning_msg").hide();
  $("#notification").hide();
  var data_size = 0;
  var item_color = "#F0FFFF";
  var mod_item = {text:"",through:false};

  $("#sortable").sortable({
  //  revert: 300,
      start: function(event, ui) {
           var start_pos = ui.item.index();
           ui.item.data('start_pos', start_pos);
       },
       update: function(event, ui) {
           var start_pos = ui.item.data('start_pos');
           var end_pos = ui.item.index();
           self.port.emit("sortover",{old:start_pos,new:end_pos});//sent the old and the new position
       }
  });

  self.port.once("init_array",function(ar){ //ar -> tasks
    self.port.once("line-through_update",function(table){ //table -> through_tasks

      //console.log("init array: " + ar +" length "+ar.length);
      for (var i = 0; i < ar.length; i++) {
        if(table[i] == false){
          $(".list-group").append('<li class="list-group-item" style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button>  <input id="checkbox" class="checkbox" type="checkbox" value=""> <div id="txt"  class="txt">'+ ar[i] +'</div></li>');
        }
        else{
          self.port.emit("decrease_badge",null);
          $(".list-group").append('<li class="list-group-item" style="background-color:'+ item_color +';text-decoration:line-through"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button>  <input id="checkbox" class="checkbox" type="checkbox" value="" checked> <div id="txt"  class="txt">'+ ar[i] +'</div></li>');
        }
        data_size += ar[i].length +1;
      }//for loop

    });
  });


  self.port.on("bc",function(value){ //change the background-color from the settings
    $("body").css("background-color",value);
  });

  self.port.on("ic",function(value){ //change the item color from the settings
      item_color = value;
      $(".list-group-item").css("background-color",value);
  });

  self.port.on("btn",function(){
    $("body").css("background-color", "#6692A5");
    $(".list-group-item").css("background-color","#F0FFFF");
  });

  self.port.on("clear data",function(){ //remove all the li
    $("#sortable").empty();
    data_size = 0;
  });

  self.port.on("contex_item",function(t){ //copy text from the page and add it to the list
    //console.log("contex_item add");
    if(t!="" && (data_size + t.length+1 < 5000000 ) ){
      t = t.autoLink({ target: "_blank", rel: "nofollow", id: "1" });
      self.port.emit("addTask",t);
      $(".list-group").append('<li class="list-group-item" style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button>  <input id="checkbox" class="checkbox" type="checkbox" value=""><div id="txt"  class="txt">'+ t +'</div></li>');
      data_size += t.length+1;
    }
    else{
      $("#warning_msg").show();
      setTimeout(function(){$("#warning_msg").hide()},3000);
    }
  });

  $("#btn").click( addTask );

  $("input").keypress(function(e){ //press enter
     if (e.keyCode == 13 && mod_item.text == ""){
       addTask();
     }
  });


  function addTask(){  //add
    //console.log("save task (add)");
    var t = $("#read_task").val();

    if( /\S/.test(t) ){//if the string has not only spaces

      if( data_size + t.length +1< 5000000 ){
        self.port.emit("increase_badge",null);
        t = t.autoLink({ target: "_blank", rel: "nofollow", id: "1" });
        $(".list-group").append('<li class="list-group-item" style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button>   <input id="checkbox" type="checkbox" class="checkbox" value=""><div id="txt"  class="txt">'+ t +'</div></li>');

        self.port.emit("addTask",t.autoLink({ target: "_blank", rel: "nofollow", id: "1" }) ); //add the new task to the array
        data_size += t.length+1;
      }
      else{
        $("#warning_msg").show();
        setTimeout(function(){$("#warning_msg").hide()},3000);
      }
      $("#read_task").val("");
    }//check if the string has only spaces

}//end of function

  $(document).on('click',".list-group-item #btn_rem",function(){ //remove
    var t = $(this).parent().find(".txt").text().autoLink({ target: "_blank", rel: "nofollow", id: "1" });
    //console.log("save change (remove) "+ t);
    $(this).parent().find(".txt").text("");
    self.port.emit("deleteTask",t);

      if(  $(this).parent().css("text-decoration") != "line-through" ){
        self.port.emit("decrease_badge",null);
      }

    backup = t;
    data_size -= t.length-1;
    $(this).parent().remove();
    $("#restore").show();
    setTimeout(function(){$("#restore").hide()},3000);
  });


  $(document).on('click',"#checkbox",function(){ //checkbox

      if($(this).parent().css("text-decoration") != "line-through" && $(this).parent().find(".txt").text()!=""){
        $(this).parent().css("text-decoration","line-through");
        self.port.emit("decrease_badge",null);
        self.port.emit("line-through_update",$(this).parent().find(".txt").text());
      }
      else if($(this).parent().css("text-decoration") == "line-through"&& $(this).parent().find(".txt").text()!="" ){
        $(this).parent().css("text-decoration","none");
        self.port.emit("increase_badge",null);
        self.port.emit("line-through_remove",$(this).parent().find(".txt").text());
      }

      $(this).parent().siblings().removeClass('line-through');
      $(this).parent().toggleClass('line-through');
  });

  $(document).on("click","#clip_btn",function(){ //copy to clipboard
    self.port.emit("clipboard",$(this).parent().find(".txt").text());
    $("#notification").show();
    setTimeout(function(){$("#notification").hide()},1500);
  });


  $(document).on("dblclick","li",function(){ //double click on a list item
    var txt = $(this).find(".txt").text();

    if(mod_item.text == ""){
      $(".btn").prop('disabled', true); $(".checkbox").prop("disabled",true);

      mod_item.text = txt;
      if( $(this).find(".checkbox").prop('checked')){
        self.port.emit("increase_badge",null);
        mod_item.through = true;
      }
      else mod_item.through = false;

      $(this).replaceWith(function(){
        return $(' \
        <div id="temp_item"> \
          <div class="input-group"> \
            <input type="text" id="read_task" value="'+txt+'" class="form-control input-sm"> \
            <span class="input-group-btn"> \
              <button type="button" id="save_change" class="btn btn-success " ><span class="glyphicon glyphicon-floppy-saved"></span></button> \
              <button type="button" id="cancel" class="btn btn-danger " ><span class="glyphicon glyphicon glyphicon-remove"></span></button> \
            </span> \
          </div> \
        </div> \
        ');
      });
    }
    //else the user is modifing an other task

  });


  $(document).on("click","#save_change",function(){ //save the new string
      //console.log("modify the task");

      $(".btn").prop('disabled', false); $(".checkbox").prop("disabled",false);
      $("#temp_item").replaceWith(function(){
        var txt = $("#temp_item").find("#read_task").val(); //find the new task
        self.port.emit("modify task",{old:mod_item.text,new:txt,through:mod_item.through});  //send the old and the new content to the index.js (update the tasks array)
        data_size += mod_item.text.length - txt.length;
          return '<li class="list-group-item"  style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button> <input id="checkbox" class="checkbox" type="checkbox" value=""><div id="txt"  class="txt">'+txt +'</div></li>'
      });
    mod_item.text = "";//clear the string var , if the sting is empty means that the user can modify an other task
  });


  $(document).on("click","#cancel",function(){
      $(".btn").prop('disabled', false); $(".checkbox").prop("disabled",false);

      $("#temp_item").replaceWith(function(){
        if(mod_item.through == true){
          self.port.emit("decrease_badge",null);
          return '<li class="list-group-item"  style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button> <input id="checkbox" class="checkbox" type="checkbox" value="" checked><div id="txt" style="text-decoration:line-through" class="txt">'+mod_item.text+'</div></li>'
        }
        else
          return '<li class="list-group-item"  style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button> <input id="checkbox" class="checkbox" type="checkbox" value=""><div id="txt"  class="txt">'+mod_item.text+'</div></li>'
      });
      mod_item.text = "";//clear the string var , if the sting is empty means that the user can modify an other task
  });


  $("#restore").on("click",function(){ // undo button
    if(backup !=""){
      $(".list-group").append('<li class="list-group-item"  style="background-color:'+ item_color +'"> <button class="btn btn-danger" id="btn_rem"><span id="icon_rem" class="glyphicon glyphicon-remove"></span></button> <button class="btn btn-default" id="clip_btn"><span id="clipboard" class="glyphicon glyphicon-copy"></span></button> <input id="checkbox" class="checkbox" type="checkbox" value=""><div id="txt"  class="txt">'+backup +'</div></li>');
      self.port.emit("addTask", backup ); //add the new task to the array
      data_size += backup.length-1;
      self.port.emit("increase_badge",null);
      backup="";
    }
    $("#restore").hide();
  });

}//onload
