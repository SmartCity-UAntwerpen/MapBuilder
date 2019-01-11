//move this to data.js after testing
var robot_arrow_size = 4;
var robot_tile_size = 80;
var robot_node_size = 5;
var robot_light_size = 5;
var robot_link_center_size = 2;
var robot_show_weights = false;

//Use borderpoints in backend robot -> draw links

/* Global variables used in robot.js */
var ctx_robot_frontend, ctx_robot_backend;
var robot_nodes_filtered = [];
var robot_links_filtered = [];
var robot_tiles_filtered = [];
var robot_link_centers = [];


function drawCanvasRobot(){
  createRobotNodes();
  ctx_robot_frontend.clearRect(0, 0, 1200, 800);
  ctx_robot_backend.clearRect(0, 0, 1200, 800);
  robot_nodes_filtered = getValuesWithMapId(robot_nodes, currentMapId);
  robot_links_filtered = getValuesWithMapId(robot_links, currentMapId);
  robot_tiles_filtered = getValuesWithMapId(robot_tiles, currentMapId);
  drawTiles();
  drawRobotLinks();
  drawRobotNodes();
}


function createCanvasEventsRobot(){
  createCanvasEventsRobotFrontEnd();
  createCanvasEventsRobotBackEnd();
}


function createCanvasEventsRobotBackEnd(){


  var isDown = false;
  var node_id = -1;
  var link_id = -1;

  var x1, y1, x2, y2;

  $('#robotBackendCanvas').mousedown(function(e){
    if (isDown === false) {
        isDown = true;
        var pos = getMousePos(robotBackendCanvas, e);
        x1 = pos.x;
        y1 = pos.y;
        link_id = findElement(robot_link_centers, robot_link_center_size*3, x1, y1)
        node_id = findElement(robot_nodes_filtered, robot_node_size, x1, y1)
        if(link_id != -1){
          if(e.which == 1){ //left click
            editRobotLink(link_id);
          }
          else if (e.which == 3) { //right click
            deleteRobotLink(link_id);
          }
        }
      }
  });

  $(window).on('mouseup', function(e){
    if (isDown === true) {
      var pos = getMousePos(robotBackendCanvas, e);
      x2 = pos.x;
      y2 = pos.y;
      isDown = false;
      if(node_id != -1){
        var end_node_id = findElement(robot_nodes_filtered, robot_node_size, x2, y2);
        if(end_node_id != -1 & end_node_id != node_id){
          addRobotLink(node_id, end_node_id);
        }
      }
    }
  });
}

function editRobotLink(id){
  var link = getItemWithId(id, robot_links);
  if(link.startTile == link.stopTile){
    link.angle = toIntOrZero(prompt(ask_angle + " [old value: " + link.angle + "]"));
  }
  else{
    link.length = toIntOrZero(prompt(ask_length + " [old value: " + link.length + "]"));
  }
  link.weight = toIntOrZero(prompt(ask_linkweight + + " [old value: " + link.weight + "]"));
  refresh();
}
function deleteRobotLink(id){
  deleteIdFromData(id, robot_links);
  refresh();
}

function addRobotLink(start, stop){
  var start_tile = getItemWithId(start, robot_nodes).tileId;
  var stop_tile = getItemWithId(stop, robot_nodes).tileId;
  var id = getNewId(robot_links);
  var angle = weight = length = 0;

  if(start_tile == stop_tile){
    angle = toIntOrZero(prompt(ask_angle));
  }
  else{
    length = toIntOrZero(prompt(ask_length));
  }
  weight = toIntOrZero(prompt(ask_linkweight));

  var robot_link = {"id":id,
                    "start":start,
                    "stop":stop,
                    "startTile":start_tile,
                    "stopTile":stop_tile,
                    "angle":angle,
                    "weight":weight,
                    "length":length,
                    "mapId":currentMapId}
  robot_links.push(robot_link);
  refresh();
}

function createCanvasEventsRobotFrontEnd(){
  $('#robotFrontendCanvas').mousedown(function(e){
    var pos = getMousePos(robotFrontendCanvas,e);
    var x = pos.x;
    var y = pos.y;
    var tileId = findElement(robot_tiles_filtered, robot_tile_size,x,y)
    if(tileId == -1){
      switch (e.which) {
        case 1:
          createTile(x,y);
          break;
      }
    }
    else{
      switch (e.which) {
        case 1:
          launchTileDialog(tileId);
          break;
        case 3:
          deleteTile(tileId)
          break;
      }
    }
  })
}



function createTile(x,y){
  var id = getNewId(robot_tiles);
  var robot_tile = {"id":id,
                    "x":x,
                    "y":y,
                    "canvastype":0,
                    "mapId": currentMapId,
                    "isTile": false,
                    "rfid":"",
                    "tiletype":"",
                    "nodes":0}

  if(robot_tiles_filtered.length != 0){  //get closest tile, put it next to it

    var d; //smallest distance
    var closest_x, closest_y; //closest point

    //take shortest_distance
    $.each(robot_tiles_filtered, function(key,values){
      var temp_d = Math.pow(Math.pow(x-values.x,2) + Math.pow(y-values.y,2),0.5)
      if(temp_d<d || d==null){
        d=temp_d;
        closest_x = values.x;
        closest_y = values.y;
      }
    })

    var h = x - closest_x;
    var v = y - closest_y;
    var new_x = closest_x, new_y = closest_y;
    if(Math.abs(h)>Math.abs(v)){
      if(h>0){
        new_x += robot_tile_size
      }
      else{
        new_x -= robot_tile_size
      }
    }
    else{
      if(v>0){
        new_y += robot_tile_size
      }
      else{
        new_y -= robot_tile_size
      }
    }

    robot_tile.x = new_x;
    robot_tile.y = new_y;
  }
  robot_tiles.push(robot_tile)
  refresh();
}


function deleteTile(id){
  var tileId = getItemWithId(id, robot_tiles).tileId
  deleteIdFromData(id, robot_tiles);
  deleteRobotNodes(tileId);
}


function deleteRobotNodes(tileId){


  var toDeleteLinkIds = []
  $.each(robot_links, function(key, values) {
    if((tileId == values.startTile)||(tileId == values.stopTile)){
      toDeleteLinkIds.push(values.id);
    }
  });
  for (var i = 0; i < toDeleteLinkIds.length; i++) {
    deleteIdFromData(toDeleteLinkIds[i], robot_links);
  }

  var toDeleteNodes = []
  $.each(robot_nodes, function(key, values) {
    if(tileId == values.tileId){
      toDeleteNodes.push(values.id);
    }
    if(values.isTransit){
      deleteTopNode(values.tileId, values.mapId)
    }
  });
  for (var i = 0; i < toDeleteNodes.length; i++) {
    deleteIdFromData(toDeleteNodes[i], robot_nodes);
  }
  refresh();
}

function launchTileDialog(id){
  $("#robotTileDialog").dialog({
    open: function(event, ui){
      var tile = getItemWithId(id, robot_tiles)
      $("#robotTileId").text(tile.id)
      $("#robotTileInputCanvasType").val(tile.canvastype);
      $("#robotTileInputRfid").val(tile.rfid);
    },
    close: function(event, ui) {
        var canvastype = toIntOrZero($("#robotTileInputCanvasType").val());
        var rfid = $("#robotTileInputRfid").val();
        editTile(id, canvastype, rfid)
    },
    width: "500px"
  });
}

function editTile(id, canvastype, rfid){

  var nodecount = 0;
  var tiletype = "";
  var tile = getItemWithId(id, robot_tiles)

  if(canvastype >= 1 & canvastype <= 11){

    tile.isTile = true;
    tile.rfid = rfid;

    //look at nodes & tiletype
    if(canvastype < 6){
      tiletype = "crossing"
      if(canvastype == 1){
        nodecount = 8;
      }
      else{
        nodecount = 6;
      }
    }
    else{
      nodecount = 1;
      if(canvastype <= 7){
        tiletype = "tlight"
      }
      else{
        tiletype = "end"
      }
    }
  }

  tile.canvastype = canvastype;
  tile.nodes = nodecount;
  tile.tiletype = tiletype;
  editIdFromData(id, robot_tiles, tile)
  refresh();
}

function makeTileIds(){
  var id = 0;
  $.each(robot_tiles, function(key,values){
    if(values.isTile){
      values.tileId = id;
      id++;
    }
  })
}

function createRobotNodes(){
  makeTileIds();
  robot_nodes = [];

  cleanRobotNodesInTop(); //make it save x,y


  $.each(robot_tiles, function(key,values){

    var positions;
    var size = robot_tile_size;

    if(values.nodes > 1){
      var x = [values.x-size/2+10, values.x - 10, values.x + 10, values.x+size/2-10];
      var y = [values.y-size/2+10, values.y - 10, values.y + 10, values.y+size/2-10];
      positions = [[x[1],y[0]],[x[2],y[0]],[x[3],y[1]],[x[3],y[2]],[x[2],y[3]],[x[1],y[3]],[x[0],y[2]],[x[0],y[1]]]
    }
    else{
      positions = [values.x, values.y]
    }

    if(values.nodes == 6){
      switch (values.canvastype) {
        case 4:
          positions = positions.slice(0,6);
          break;
        case 5:
          positions = positions.slice(2,8);
          break;
        case 2:
          positions = positions.slice(0,2).concat(positions.slice(4,8));
          break;
        case 3:
          positions = positions.slice(0,4).concat(positions.slice(6,8));
          break;
      }
    }

    for (var i = 0; i < values.nodes; i++) {
      var id = getNewId(robot_nodes);
      var posx = (values.nodes > 1)? positions[i][0] : positions[0];
      var posy = (values.nodes > 1)? positions[i][1] : positions[1];
      robot_nodes.push({"id":id,
                        "tileId":values.tileId,
                        "x":posx,
                        "y":posy,
                        "mapId":values.mapId,
                        "isTransit":(values.tiletype == "end")})
    }

    if(values.tiletype == "end"){
      $.each(robot_nodes, function(k,v){
        if(v.tileId == values.tileId){
          addTopNode(v.id, values.mapId);
        }
      })
    }
  })
}



/* Draw Functions */
var tile_center
var tile_left
var tile_right
var tile_up
var tile_bottom

function drawTiles(){
  $.each(robot_tiles_filtered, function(key, values) {
    drawTile(values);
  });
}


function drawTile(tile){
  var size = robot_tile_size;

  tile_center = [tile.x, tile.y];
  tile_left = [tile.x - size/2, tile.y];
  tile_right = [tile.x + size/2, tile.y];
  tile_up = [tile.x, tile.y - size/2];
  tile_bottom = [tile.x, tile.y + size/2];


  ctx_robot_frontend.beginPath();
  ctx_robot_frontend.setLineDash([6])
  ctx_robot_frontend.strokeRect(tile.x-size/2, tile.y-size/2, size, size);
  ctx_robot_frontend.fillStyle= nodeColor;
  ctx_robot_frontend.fillRect(tile.x-size/2, tile.y-size/2, size, size);
  ctx_robot_frontend.fillStyle="black"
  ctx_robot_frontend.setLineDash([])


  if(tile.tileId > -1){
    ctx_robot_frontend.fillText(tile.tileId, tile.x - size/2 +4, tile.y - size/2 +12)
  }

  switch (tile.canvastype) {
    case 1:
      drawUpBottom();
      drawLeftRight()
      break;
    case 2:
      drawUpBottom();
      drawLeft();
      break;
    case 3:
      drawLeftRight();
      drawUp();
      break;
    case 4:
      drawUpBottom();
      drawRight();
      break;
    case 5:
      drawLeftRight();
      drawBottom();
      break;
    case 6:
      drawLeftRight();
      drawLight();
      break;
    case 7:
      drawUpBottom();
      drawLight();
      break;
    case 8:
      drawRight();
      break;
    case 9:
      drawBottom();
      break;
    case 10:
      drawLeft();
      break;
    case 11:
      drawUp();
      break;
    case 12:
      drawLeftRight();
      break;
    case 13:
      drawUpBottom();
      break;
    case 14:
      drawRight();
      drawBottom();
      break;
    case 15:
      drawBottom();
      drawLeft();
      break;
    case 16:
      drawLeft();
      drawUp();
      break;
    case 17:
      drawUp()
      drawRight();
      break;
  }
  ctx_robot_frontend.stroke();
}

function drawLight(){
  var pos = [tile_center[0]+robot_tile_size/4, tile_center[1]-robot_tile_size/4]
  ctx_robot_frontend.moveTo(pos[0], pos[1])
  ctx_robot_frontend.arc(pos[0],pos[1],robot_light_size,0,2*Math.PI, false)
}

function drawLeftRight(){
  drawLeft();
  drawRight();
}

function drawUpBottom(){
  drawUp();
  drawBottom();
}

function drawUp(){
  ctx_robot_frontend.moveTo(tile_up[0], tile_up[1])
  ctx_robot_frontend.lineTo(tile_center[0], tile_center[1])
}

function drawLeft(){
  ctx_robot_frontend.moveTo(tile_left[0], tile_left[1])
  ctx_robot_frontend.lineTo(tile_center[0], tile_center[1])
}

function drawRight(){
  ctx_robot_frontend.moveTo(tile_right[0], tile_right[1])
  ctx_robot_frontend.lineTo(tile_center[0], tile_center[1])
}
function drawBottom(){
  ctx_robot_frontend.moveTo(tile_bottom[0], tile_bottom[1])
  ctx_robot_frontend.lineTo(tile_center[0], tile_center[1])
}

function drawRobotNodes(){
  $.each(robot_nodes_filtered, function(key, values) {
    drawRobotNode(values);
  })
}

function drawRobotNode(robot){
  var size = robot_node_size;
  ctx_robot_backend.beginPath();
  ctx_robot_backend.rect(robot.x-size/2,robot.y-size/2,size,size);
  ctx_robot_backend.fillStyle=(robot.isTransit)? nodeColorTransit : nodeColor;;
  ctx_robot_backend.fillRect(robot.x-size/2,robot.y-size/2,size,size);
  ctx_robot_backend.fillStyle="black"
  ctx_robot_backend.fillText(robot.id, robot.x-size/2, robot.y-4)
  ctx_robot_backend.stroke();
}

function drawRobotLinks(){
  $.each(robot_links_filtered, function(key, values) {
    drawRobotLink(values);
  })
}

function drawRobotLink(link){

  var node_start = getItemWithId(link.start, robot_nodes);
  var node_stop = getItemWithId(link.stop, robot_nodes);

  var pos = getBorderPoints(node_start.x, node_start.y, node_stop.x, node_stop.y, robot_node_size);
  var x1 = pos[0], y1 = pos[1], x2 = pos[2], y2 = pos[3];
  var angle = Math.atan2(y2-y1,x2-x1);

  ctx_robot_backend.beginPath();
  ctx_robot_backend.moveTo(x1, y1);
  ctx_robot_backend.lineTo(x2, y2);

  ctx_robot_backend.lineTo(x2-robot_arrow_size*Math.cos(angle-Math.PI/6),y2-robot_arrow_size*Math.sin(angle-Math.PI/6));
  ctx_robot_backend.moveTo(x2, y2);
  ctx_robot_backend.lineTo(x2-robot_arrow_size*Math.cos(angle+Math.PI/6),y2-robot_arrow_size*Math.sin(angle+Math.PI/6));

  //Draw link centers
  var centerx = (x1+x2)/2;
  var centery = (y1+y2)/2;
  ctx_robot_backend.moveTo(centerx, centery);
  ctx_robot_backend.arc(centerx,centery,robot_link_center_size,0,2*Math.PI, false)

  //Add link centers to array
  var robot_link_center = {"id":link.id, "x":centerx, "y":centery}
  robot_link_centers.push(robot_link_center)

  ctx_robot_backend.stroke();

  //Draw weights
  if(link.weight > 0 & robot_show_weights){
    var m = (y2-y1)/(x2-x1);
    if(m>1){
      ctx_robot_backend.strokeText(link.weight,centerx+6,centery)
    }
    else if (m<-1) {
      ctx_robot_backend.strokeText(link.weight,centerx-10,centery)
    }
    else{
      ctx_robot_backend.strokeText(link.weight,centerx-3,centery-5)
    }
  }
}
