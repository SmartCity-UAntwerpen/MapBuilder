/* Variables */
var top_node_size = 20;


/* Global variables used by top.js */
var ctx_top;


var top_link_center_size = 3;
var top_link_centers = []; //Stored link position


/* Functions on top_nodes */
function addTopNode(edgeId, mapId){
  var id = getNewId(top_nodes);
  var found = top_nodes.find(function(element){
    return element.mapId == mapId & element.edgeId == edgeId
  })

  var top_node = {"id":id,
                  "mapId":mapId,
                  "edgeId":edgeId,
                  "x":top_node_size,
                  "y":top_node_size};
  if(!found){
    top_nodes.push(top_node);
  }
}

function deleteTopNode(edgeId, mapId){
  var found_id = -1;
  $.each(top_nodes, function(key, values) {
    if(mapId == values.mapId & edgeId == values.edgeId){
      found_id = values.id;
    }
  });
  deleteIdFromData(found_id, top_nodes);

  var toDeleteLinkIds = []
  $.each(top_links, function(key, values) {
    if((found_id == values.start)||(found_id == values.stop)){
      toDeleteLinkIds.push(values.id);
    }
  });
  for (var i = 0; i < toDeleteLinkIds.length; i++) {
    deleteIdFromData(toDeleteLinkIds[i], top_links);
  }
}

function moveTopNode(id, x, y){
  var node = getItemWithId(id, top_nodes);
  node.x = x;
  node.y = y;
  editIdFromData(id, top_nodes, node);
  refresh();
}


/* Functions on top_links */
function addTopLink(start, stop){
  var isDuplicateLink = false;
  $.each(top_links, function(key, values) {
    if(start == values.start && stop == values.stop){
      isDuplicateLink = true;
    }
  });
  if(!isDuplicateLink){
    var id = getNewId(top_links);
    var link = {"id":id,"start":start, "stop":stop,"weight":1}
    top_links.push(link);
  }
  refresh();
}
function deleteTopLink(id){
  deleteIdFromData(id, top_links);
  refresh();
}
function editTopLink(id, weight){
  var top_link = getItemWithId(id, top_links)
  top_link.weight = weight;
  editIdFromData(id, top_links, top_link);
  refresh();
}


/* Events of topcanvas*/
function createCanvasEventsTop(){

  var isDown = false;
  var node_id = -1;
  var link_id = -1;

  var x1, y1, x2, y2;

  $('#topCanvas').mousedown(function(e){
    if (isDown === false) {
        isDown = true;
        var pos = getMousePos(topCanvas, e);
        x1 = pos.x;
        y1 = pos.y;
        node_id = findElement(top_nodes, top_node_size, x1, y1)
        link_id = findElement(top_link_centers, top_link_center_size*3, x1, y1)

        if(link_id != -1){
          if(e.which == 1){ //left click
            var prevWeight = getItemWithId(link_id, top_links).weight;
            var new_weight = toIntOrZero(prompt(ask_linkweight + " [old value: " + prevWeight + "]"));
            editTopLink(link_id, new_weight);
          }
          else if (e.which == 3) { //right click
            deleteTopLink(link_id);
          }
        }
      }
  });

  $(window).on('mouseup', function(e){
    if (isDown === true) {

      var pos = getMousePos(topCanvas, e);
      x2 = pos.x;
      y2 = pos.y;
      isDown = false;

      if(node_id != -1){
        var end_node_id = findElement(top_nodes, top_node_size, x2, y2);
        if(end_node_id != -1 & end_node_id != node_id){
          addTopLink(node_id, end_node_id);
        }
        else if(x1 != x2 & y1 != y2){
          moveTopNode(node_id, x2, y2);
        }
      }
    }
  });
}


/*Draw functions */
function drawCanvasTop(){
  ctx_top.clearRect(0, 0, 600, 400);
  drawTopLinks();
  drawTopNodes();
}

function drawTopNodes(){
  $.each(top_nodes, function(key, values){
    drawTopNode(values);
  })
}

function drawTopNode(top){
  var size = top_node_size;
  ctx_top.beginPath();
  ctx_top.rect(top.x-size/2,top.y-size/2,size,size);
  ctx_top.fillStyle=nodeColor;
  ctx_top.fillRect(top.x-size/2,top.y-size/2,size,size);
  ctx_top.fillStyle="black"
  ctx_top.fillText(top.mapId + ',' + top.edgeId, top.x+2-size/2, top.y);
  ctx_top.stroke();
}

function drawTopLinks(){
  $.each(top_links, function(key, values){
    drawTopLink(values);
  })
}

function drawTopLink(link){
  var node_start = getItemWithId(link.start, top_nodes);
  var node_stop = getItemWithId(link.stop, top_nodes);

  var x1 = node_start.x, x2 = node_stop.x;
  var y1 = node_start.y, y2 = node_stop.y;

  ctx_top.beginPath();
  ctx_top.moveTo(x1, y1);
  ctx_top.lineTo(x2, y2);

  //Draw link centers
  var centerx = (x1+x2)/2;
  var centery = (y1+y2)/2;
  ctx_top.moveTo(centerx, centery);
  ctx_top.arc(centerx,centery,top_link_center_size,0,2*Math.PI, false)

  //Add link centers to array
  var top_link_center = {"id":link.id, "x":centerx, "y":centery}
  top_link_centers.push(top_link_center)

  ctx_top.stroke();

  //Draw weights
  var m = (y2-y1)/(x2-x1);
  if(m>1){
    ctx_top.strokeText(link.weight,centerx+6,centery)
  }
  else if (m<-1) {
    ctx_top.strokeText(link.weight,centerx-10,centery)
  }
  else{
    ctx_top.strokeText(link.weight,centerx-3,centery-5)
  }
}


function cleanRobotNodesInTop(){
  var robot_map_ids = [];
  $.each(maps, function(key,values){
    if(values.type == "ROBOT"){
      robot_map_ids.push(values.id);
    }
  })

  var toDeleteTopNodes = []
  $.each(robot_map_ids, function(key,values){
    $.each(top_nodes, function(k,v){
      if(values == v.mapId){
        toDeleteTopNodes.push(v.id);
      }
    })
  })
  $.each(toDeleteTopNodes,function(key,values){
    deleteIdFromData(values, top_nodes)
  })
}
