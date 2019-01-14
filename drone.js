/* Variables */
var drone_map_offset = 10;
var drone_node_size = 20;
var drone_link_center_size = 4;
var drone_map_scale = 20;
var drone_show_links = false;

var ctx_drone;
var drone_nodes_filtered = [] //id, x,y,z ,isTransit, mapId
var drone_links_filtered = []
var drone_link_centers = []


function addDroneNode(x,y){
  var id = getNewId(drone_nodes)
  var node = {"id":id,
              "x":x,
              "y":y,
              "drone_x":Number((x-drone_map_offset)/drone_map_scale).toFixed(2),
              "drone_y":Number((y-drone_map_offset)/drone_map_scale).toFixed(2),
              "drone_z":0,
              "isTransit":false,
              "mapId":currentMapId};
  drone_nodes.push(node);
  $.each(drone_nodes_filtered, function(key, values){
    var link = {"id":getNewId(drone_links),
                "start":id,
                "stop":values.id,
                "mapId":currentMapId}
    drone_links.push(link);
  })
  deleteTopNode(id, currentMapId)
  refresh();
}

function deleteDroneNode(id){
  deleteIdFromData(id, drone_nodes);

  var toDeleteLinkIds = []
  $.each(drone_links, function(key, values) {
    if((id == values.start)||(id == values.stop)){
      toDeleteLinkIds.push(values.id);
    }
  });
  for (var i = 0; i < toDeleteLinkIds.length; i++) {
    deleteIdFromData(toDeleteLinkIds[i], drone_links);
  }
  refresh();
}

function editDroneNode(id,x,y,z,isTransit){
  $.each(drone_nodes_filtered, function(key,values){

    if(values.id == id){

      x = Number(x).toFixed(2)
      y = Number(y).toFixed(2)

      values.x = (x*drone_map_scale) + drone_map_offset;
      values.y = (y*drone_map_scale) + drone_map_offset;
      values.drone_x = x;
      values.drone_y = y;
      values.drone_z = z;

      if(values.isTransit != isTransit){
        if(isTransit){
          addTopNode(id,currentMapId)
        }
        else{
          deleteTopNode(id,currentMapId)
        }
      }
      values.isTransit = isTransit;
    }
  });
  refresh();
}

function moveDroneNode(id,x,y){
  var node = getItemWithId(id, drone_nodes);
  node.x = x;
  node.y = y;
  node.drone_x = Number(x/drone_map_scale).toFixed(2);
  node.drone_y = Number(y/drone_map_scale).toFixed(2);
  refresh();
}

function addDroneLink(start,stop){
  var isDuplicateLink = false;
  $.each(drone_links, function(key, values) {
    if(start == values.start && stop == values.stop){
      isDuplicateLink = true;
    }
  });
  if(!isDuplicateLink){
    var id = getNewId(drone_links);
    var link = {"id":id,"start":start, "stop":stop,"weight":1, "mapId":currentMapId}
    drone_links.push(link);
  }
  refresh();
}

function deleteDroneLink(id){
  deleteIdFromData(id, drone_links);
  refresh();
}

function createCanvasEventsDrone(){
  var isDown = false;
  var node_id = -1;
  var link_id = -1;
  var x1, y1, x2, y2;

  $("#droneCanvas").dblclick(function(e){
    var pos = getMousePos(droneCanvas, e);
    var node_id = findElement(drone_nodes_filtered, drone_node_size, pos.x,pos.y);
    if(node_id != -1){
      deleteDroneNode(node_id)
    }
    else{
      addDroneNode(pos.x,pos.y);
    }
  })

  $('#droneCanvas').mousedown(function(e){
    if (isDown === false) {
        isDown = true;
        var pos = getMousePos(droneCanvas, e);
        x1 = pos.x;
        y1 = pos.y;
        node_id = findElement(drone_nodes, drone_node_size, x1, y1)
      }
  });

  $(window).on('mouseup', function(e){
    if (isDown === true) {

      var pos = getMousePos(droneCanvas, e);
      x2 = pos.x;
      y2 = pos.y;
      isDown = false;

      if(node_id != -1){
        if(e.which == 1){//left click
          var end_node_id = findElement(drone_nodes_filtered, drone_node_size, x2, y2);
          if(x1 != x2 & y1 != y2){
            moveDroneNode(node_id, x2, y2);
          }
        }
        else{ //right click
          launchDroneDialog(node_id);
        }
      }
    }
  });
}

function launchDroneDialog(id){
  $("#droneDialog").dialog({
    open: function(event, ui){
      var drone_node = getItemWithId(id, drone_nodes)
      $("#droneId").text(drone_node.id)
      $("#droneInputX").val(drone_node.drone_x);
      $("#droneInputY").val(drone_node.drone_y);
      $("#droneInputZ").val(drone_node.drone_z);
      $("#droneInputIsTransit").prop('checked',drone_node.isTransit);
    },
    close: function(event, ui) {
        var drone_x = $("#droneInputX").val();
        var drone_y = $("#droneInputY").val();
        var drone_z = $("#droneInputZ").val();
        var drone_isTransit = $("#droneInputIsTransit").prop('checked');
        editDroneNode(id, drone_x, drone_y, drone_z, drone_isTransit)
    }
  })
}

function drawCanvasDrone(){
  ctx_drone.clearRect(0, 0, 600, 400);
  drone_nodes_filtered = getValuesWithMapId(drone_nodes,currentMapId);
  drone_links_filtered = getValuesWithMapId(drone_links,currentMapId);
  if(drone_show_links){
    drawDroneLinks();
  }
  drawDroneNodes();
}

function drawDroneNodes(){
  $.each(drone_nodes_filtered, function(key,values){
    drawDroneNode(values)
  })
}

function drawDroneNode(drone){
  var size = drone_node_size;
  ctx_drone.beginPath();
  ctx_drone.rect(drone.x-size/2,drone.y-size/2,size,size);
  ctx_drone.fillStyle=(drone.isTransit)? nodeColorTransit : nodeColor;
  ctx_drone.fillRect(drone.x-size/2,drone.y-size/2,size,size);
  ctx_drone.fillStyle="black"
  ctx_drone.fillText(drone.id, drone.x+2-size/2, drone.y)
  ctx_drone.stroke();
}

function drawDroneLinks(){
  $.each(drone_links_filtered, function(key, values) {
    drawDroneLink(values);
  });
}
function drawDroneLink(link){
  var node_start = getItemWithId(link.start, drone_nodes_filtered);
  var node_stop = getItemWithId(link.stop, drone_nodes_filtered);

  var x1 = node_start.x, x2 = node_stop.x;
  var y1 = node_start.y, y2 = node_stop.y;

  ctx_drone.beginPath();
  ctx_drone.moveTo(x1, y1);
  ctx_drone.lineTo(x2, y2);

  ctx_drone.stroke();
}
