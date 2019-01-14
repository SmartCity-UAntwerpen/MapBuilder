/* Variables */
var car_map_offset = 10; //to avoid negative x,y
var car_map_scale = 20;
var car_node_size = 20;
var car_show_links = true;

/* Global variables used by car.js */
var ctx_car;
var car_nodes_filtered = []
var car_links_filtered = []

/*Functions on car_nodes */
function addCarNode(x,y){
  var id = getNewId(car_nodes);
  var node = {"id":id,
              "x":x,
              "y":y,
              "car_x":Number((x-car_map_offset)/car_map_scale).toFixed(2),
              "car_y":Number((y-car_map_offset)/car_map_scale).toFixed(2),
              "car_z":0,
              "car_w":0,
              "isTransit":false,
              "mapId":currentMapId}
  car_nodes.push(node);
  $.each(car_nodes_filtered, function(key, values){
    var link = {"id":getNewId(car_links),
                "start":id,
                "stop":values.id,
                "mapId":currentMapId}
    car_links.push(link);
  })
  refresh();
}

function deleteCarNode(id){
  deleteTopNode(id, currentMapId);

  //delete the node from car_nodes
  deleteIdFromData(id, car_nodes);

  //delete the car_links from the car_node
  var toDeleteLinkIds = []
  $.each(car_links, function(key, values) {
    if((id == values.start)||(id == values.stop)){
      toDeleteLinkIds.push(values.id);
    }
  });
  for (var i = 0; i < toDeleteLinkIds.length; i++) {
    deleteIdFromData(toDeleteLinkIds[i], car_links);
  }
  deleteTopNode(id, currentMapId);
  refresh();
}

function updateCarNode(id,x,y,z,w,mapname,isTransit){
  $.each(car_nodes_filtered, function(key,values){
    if(values.id == id){

      x = Number(x).toFixed(2)
      y = Number(y).toFixed(2)

      values.x = (x * car_map_scale) + car_map_offset;
      values.y = (y * car_map_scale) + car_map_offset;

      values.car_x = x;
      values.car_y = y;
      values.car_z = z;
      values.car_w = w;
      values.mapname = mapname;

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


/* Events of carcanvas */
function createCanvasEventsCar(){
  $("#carCanvas").dblclick(function(e){
    var pos = getMousePos(carCanvas, e);
    var node_id = findElement(car_nodes_filtered, car_node_size, pos.x,pos.y);
    if(node_id != -1){
      deleteCarNode(node_id)
    }
    else{
      addCarNode(pos.x,pos.y);
    }
  })

  $('#carCanvas').on('mousedown', function(e){
    var pos = getMousePos(carCanvas, e);
    var node_id = findElement(car_nodes_filtered, car_node_size, pos.x,pos.y);
    if(e.which == 3 & node_id != -1){
      launchCarDialog(node_id);
    }
  });
}

function launchCarDialog(id){
  $("#carDialog").dialog({
    open: function(event, ui){
      var car_node = getItemWithId(id, car_nodes)
      $("#carId").text(car_node.id)
      $("#carInputX").val(car_node.car_x);
      $("#carInputY").val(car_node.car_y);
      $("#carInputZ").val(car_node.car_z);
      $("#carInputW").val(car_node.car_w);
      $("#carInputMapName").val(car_node.mapname)
      $("#carInputIsTransit").prop('checked',car_node.isTransit);
    },
    close: function(event, ui) {
        var car_x = $("#carInputX").val();
        var car_y = $("#carInputY").val();
        var car_z = $("#carInputZ").val();
        var car_w = $("#carInputW").val();
        var car_mapname = $("#carInputMapName").val();
        var car_isTransit = $("#carInputIsTransit").prop('checked');
        updateCarNode(id, car_x, car_y, car_z, car_w, car_mapname, car_isTransit)
    }
  });
}


/* Draw functions */
function drawCanvasCar(){
  ctx_car.clearRect(0, 0, 600, 400);
  car_nodes_filtered = getValuesWithMapId(car_nodes,currentMapId);
  car_links_filtered = getValuesWithMapId(car_links,currentMapId);
  if(car_show_links){
    drawCarLinks();
  }
  drawCarNodes();
}

function drawCarNodes(){
  $.each(car_nodes_filtered, function(key, values) {
    drawCarNode(values);
  })
}
function drawCarNode(car){
  var size = car_node_size;
  ctx_car.beginPath();
  ctx_car.rect(car.x-size/2,car.y-size/2,size,size);
  ctx_car.fillStyle=(car.isTransit)? nodeColorTransit : nodeColor;
  ctx_car.fillRect(car.x-size/2,car.y-size/2,size,size);
  ctx_car.fillStyle="black"
  ctx_car.fillText(car.id, car.x+2-size/2, car.y)
  ctx_car.stroke();
}
function drawCarLinks(){
  $.each(car_links_filtered, function(key, values) {
    drawCarLink(values);
  });
}
function drawCarLink(link){
  var node_start = getItemWithId(link.start, car_nodes_filtered);
  var node_stop = getItemWithId(link.stop, car_nodes_filtered);

  ctx_car.beginPath();
  ctx_car.moveTo(node_start.x, node_start.y);
  ctx_car.lineTo(node_stop.x, node_stop.y);
  ctx_car.stroke();
}
