//User can change these
var ask_linkweight = "linkweight? (integer)"
var ask_angle = "Angle? Answer with 0 (straight), 90 (right) or -90 (left)"
var ask_length = "Length? (integer)"
var prompt_maptype = "maptype? (ROBOT, DRONE or CAR)"
var nodeColor = "lightyellow"
var nodeColorTransit = "lightblue"

//Global track of displayed map:
var currentMapId;
var currentMapType;


$(document).ready( function () {
  //Set context for multiple canvas.
  ctx_top = document.getElementById("topCanvas").getContext("2d");
  ctx_car = document.getElementById("carCanvas").getContext("2d");
  ctx_drone = document.getElementById("droneCanvas").getContext("2d");
  ctx_robot_frontend = document.getElementById("robotFrontendCanvas").getContext("2d");
  ctx_robot_backend = document.getElementById("robotBackendCanvas").getContext("2d");
  ctx_top.canvas.width = ctx_car.canvas.width =ctx_drone.canvas.width = 600;
  ctx_robot_frontend.canvas.width = ctx_robot_backend.canvas.width = 1200;
  ctx_top.canvas.height = ctx_car.canvas.height =ctx_drone.canvas.height = 400;
  ctx_robot_frontend.canvas.height = ctx_robot_backend.canvas.height = 800;
  ctx_top.font = ctx_car.font = ctx_drone.font = "10px Arial";
  ctx_robot_frontend.font = ctx_robot_backend.font= "10px Arial";

  main();
});


function main(){
  $("#mapHeader").addClass("highlight")
  addMapButtons();        //Add html buttons to switch between maps
  createCanvasEvents();
  loadMap();              //default show & draw first map
}
function refresh(){ //Use this function everytime you change data
  //createRobotNodes();
  drawCanvas();
  displayData();
  displaySQL();
}


/* Map functions */
function addMapButtons(){
  $("#mapselect").html("");
  $.each(maps, function(key, values) {
    $("#mapselect").append( "<button class='mapselectbutton' "+
                            "id='mapButton" + values.id + "' " +
                            "onclick='loadMap("+values.id+",\""+values.type+"\")'>"+
                            values.id + ", " + values.type + "</button>")
  });
  $("#mapselect").append("<button class='mapselectbutton' "+
                      "onclick='addMap(prompt(\""+
                      prompt_maptype+"\").toUpperCase())'>+</button>");
}
function addMap(type){
  var id = getNewId(maps);
  var map = {"id":id,"type":type, "offSetX":0, "offSetY":0}
  maps.push(map);
  addMapButtons();
  loadMap(id, type);
}
function loadMap(id, type){

  //Default -> first map
  if(id == null & type == null){
    id = maps[0].id;
    type = maps[0].type;
  }

  //Set global parameters
  currentMapId = id;
  currentMapType = type;

  //Highlight correct button
  $(".mapselectbutton").removeClass("highlight")
  $("#mapButton"+id).addClass("highlight")

  //Show correct html
  $("#top, #car, #drone, #robot").hide();
  $("#"+type.toLowerCase()).show();

  $.each(maps, function(key,values){
    if(values.id == currentMapId & currentMapType != "TOP"){
      $("#"+currentMapType.toLowerCase()+"OffSetX").val(values.offSetX)
      $("#"+currentMapType.toLowerCase()+"OffSetY").val(values.offSetY)
    }
  })
  refresh();
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/* Data functions */
function displayData(){
  var datajs =  "var maps = " + JSON.stringify(maps) + "\n\n" +
                "var top_nodes = " + JSON.stringify(top_nodes) + "\n\n" +
                "var top_links = " + JSON.stringify(top_links) + "\n\n" +
                "var car_nodes = " + JSON.stringify(car_nodes) + "\n\n" +
                "var car_links = " + JSON.stringify(car_links) + "\n\n" +
                "var drone_nodes = " + JSON.stringify(drone_nodes) + "\n\n" +
                "var drone_links = " + JSON.stringify(drone_links) + "\n\n" +
                "var robot_nodes = " + JSON.stringify(robot_nodes) + "\n\n" +
                "var robot_links = " + JSON.stringify(robot_links) + "\n\n" +
                "var robot_tiles = " + JSON.stringify(robot_tiles) + "\n\n";
  $("#datajs").val(datajs);
  $("#json").val(JSON.stringify(converDataToJson()))
}
function converDataToJson(){

  var maplist = []
  var pointList = []
  var neighbours = []
  var all_nodes = [car_nodes, drone_nodes];
  var all_links = [car_links, drone_links];

  $.each(maps, function(key, values){

    if(values.type == "ROBOT"){

      var work_with_tileId = false; //otherwise it takes point/node ids

      var final = [];

      if(work_with_tileId){
        /* This is future work where we give tile ids
        instead of point ids, but robot doesnt have this implemented */
        var used_links = [];
        $.each(robot_links, function(k,v){
          if(v.startTile != v.stopTile){
            used_links.push(v)
          }
        })
        used_links = used_links.sort((a,b) => (a.startTile > b.startTile) ? 1 : ((b.startTile > a.startTile) ? -1 : 0));

        var different_tiles = []
        $.each(used_links, function(k,v){
          different_tiles.push(v.startTile)
        })
        different_tiles = different_tiles.filter(onlyUnique);


        var neighbours_arr = []
        for (var i = 0; i < different_tiles.length; i++) {
          $.each(used_links, function(k,v){
            if(v.startTile == different_tiles[i]){
              neighbours_arr.push([different_tiles[i], v.stopTile])
            }
            if(v.stopTile == different_tiles[i]){
              neighbours_arr.push([different_tiles[i], v.startTile])
            }
          })
        }

        for (var i = 0; i < neighbours_arr.length; i++) {
          var allowed = true;
          $.each(final, function(k,v){
            if(v[0] == neighbours_arr[i][0]){
              allowed = false; //Already in it
              if(!v[1].includes(neighbours_arr[i][1])){
                v[1].push(neighbours_arr[i][1])
              }
            }
          })
          if(allowed){
            final.push([neighbours_arr[i][0], [neighbours_arr[i][1]]])
          }
        }
      }
      else{
        /* Currently working with point/node - ids */
        var final1 = [];
        $.each(robot_tiles, function(key,values){
          if(values.nodes == 1){
            $.each(robot_nodes, function(k,v){
              if(v.tileId==values.tileId){
                final1.push(v.id)
              }
            })
          }
        })

        $.each(final1, function(key,values){
          final.push([values, final1])
        })
      }


      neighbours = []
      pointList = []

      $.each(final,function(key,values){
        $.each(values[1], function(k,v){
          if(values[0] != v){
            neighbours.push({"neighbour":v})
          }
        })
        var id = values[0]
        var type = "";
        var x = y = 0;

        if(work_with_tileId){
          $.each(robot_tiles,function(k,v){
            if(id == v.tileId){
              type = v.tiletype
              x = Math.floor(v.x);
              console.log(v.x)
              y = Math.floor(v.y);
            }
          })
        }
        else{
          $.each(robot_nodes,function(k,v){
            if(id == v.id){
              $.each(robot_tiles, function(k1,v1){
                if(v.tileId == v1.tileId){
                  type = v1.type
                }
              })
              x = Math.floor(v.x);
              y = Math.floor(v.y);
            }
          })
        }

        if(type == "end"){type = "ENDPOINT"};
        if(type == "crossing"){type = "INTERSECTION"};
        if(type == "tlight"){type = "LIGHT"}
        pointList.push({"id":id, "x":x,"y":y,"type":type,"neighbours":neighbours})
        neighbours = []
      })
    }
    else{
      $.each(all_nodes, function(k1, nodes){
        $.each(nodes, function(k,v){
          if(values.id == v.mapId){
            var type = (v.isTransit)? "ENDPOINT":"INTERSECTION";
            $.each(all_links[k1], function(k2, links){
              if(links.mapId == v.mapId){
                if(links.start == v.id){
                  neighbours.push({"neighbour":links.stop})
                }
                else if (links.stop == v.id) {
                  neighbours.push({"neighbour":links.start})
                }
              }
            })
            pointList.push({"id":v.id,"x":Math.floor(v.x),"y":Math.floor(v.y),"type": type, "neighbours":neighbours})
            neighbours = []
          }
        })
      })
    }

     //end for each node
    if(values.type != "TOP"){
      maplist.push({"mapId":values.id, "offsetX":values.offSetX, "offsetY":values.offSetY, "access":values.type.toLowerCase(), "pointList":pointList})
    }
    pointList = []
    offSetX = 0;
    offSetY = 0;
  }) //end for each map
  return {"maplist":maplist}
}


/* Canvas functions */
function drawCanvas(){
  switch (currentMapType) {
    case "TOP":
      drawCanvasTop();
      break;
    case "CAR":
      drawCanvasCar();
      break;
    case "DRONE":
      drawCanvasDrone();
      break;
    case "ROBOT":
      drawCanvasRobot();
      break;
    default:
  }
}
function createCanvasEvents(){
  createCanvasEventsTop();
  createCanvasEventsCar();
  createCanvasEventsDrone();
  createCanvasEventsRobot();
}


/* Helper functions */
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
function getNewId(dataSet){

  var ids = [];
  $.each(dataSet, function(key, values) {
    ids.push(values.id);
  });

  var result = -1
  ids.sort(function(a, b){return a-b})
  for(var i = 1; i < ids.length; i++) {
      if(ids[i] - ids[i-1] != 1 && result == -1) {
          result = ids[i-1] + 1;
      }
  }
  if(result==-1){
    result = (ids[0] != 0)?  0 : ids.length
  }
  return result;
}
function getItemWithId(id, items){
  var item = -1;
  $.each(items, function(key, values) {
    if(id == values.id){
      item = values;
    }
  });
  return item;
}

function deleteIdFromData(id, data){
  var foundKey = -1;
  $.each(data, function(key, values) {
    if(id == values.id){
      foundKey = key;
    }
  });
  if(foundKey != -1){
    data.splice(foundKey,1);
  }
}
function editIdFromData(id, data, obj){
  var foundKey = -1;
  $.each(data, function(key, values) {
    if(id == values.id){
      foundKey = key;
    }
  });
  if(foundKey != -1){
    data.splice(foundKey,1,obj);
  }
}
function toIntOrZero(input){
  input = parseInt(input);
  if(isNaN(input)){
    input = 0;
  }
  return input
}
function getValuesWithMapId(input, id){
  var output = [];
  $.each(input, function(key, values){
    if(values.mapId == id){
      output.push(values);
    }
  })
  return output;
}


/* Canvas helpers */
function getBorderPoints(x1, y1, x2, y2, size){
  var m = (y2-y1)/(x2-x1)
  var node1 = getBorderPoint(m, x1, y1, size);
  var node2 = getBorderPoint(m, x2, y2, size);

  //4 points, determine which are closest
  var p1x1 = node1[0][0]
  var p1y1 = node1[0][1]
  var p1x2 = node1[1][0]
  var p1y2 = node1[1][1]

  var p2x1 = node2[0][0]
  var p2y1 = node2[0][1]
  var p2x2 = node2[1][0]
  var p2y2 = node2[1][1]

  var dp11p21 = Math.sqrt(Math.pow(p2x1-p1x1,2)+Math.pow(p2y1-p1y1,2))
  var dp11p22 = Math.sqrt(Math.pow(p2x2-p1x1,2)+Math.pow(p2y2-p1y1,2))
  var dp12p21 = Math.sqrt(Math.pow(p2x1-p1x2,2)+Math.pow(p2y1-p1y2,2))
  var dp12p22 = Math.sqrt(Math.pow(p2x2-p1x2,2)+Math.pow(p2y2-p1y2,2))
  var distances = [dp11p21,dp11p22,dp12p21,dp12p22].sort(function(a, b){return a-b})
  var shortest_distance = distances[0];

  if(shortest_distance == dp11p21){
    return [p1x1,p1y1,p2x1,p2y1]
  }else if (shortest_distance == dp11p22) {
    return [p1x1,p1y1,p2x2,p2y2]
  }else if (shortest_distance == dp12p21) {
    return [p1x2,p1y2,p2x1,p2y1]
  }else{
    return [p1x2,p1y2,p2x2,p2y2]
  }
}
function getBorderPoint(m,x,y,size){
  var a1 = m*(-size/2) +y;
  var a2 = m*(size/2) +y;
  var b1 = 1/m*(-size/2) +x;
  var b2 = 1/m*(size/2) +x;

  var p1 = []
  var p2 = []
  if(y - size/2 < a1 && a1 < y + size/2){
    p1 = [x-size/2, a1]
    p2 = [x+size/2, a2]
  }
  else{
    p1 = [b1,y-size/2]
    p2 = [b2,y+size/2]
  }
  return [p1,p2]
}

function findElement(elements,size,x,y){
  var id = -1;
  $.each(elements, function(key, values) {
    if(values.x-size/2 < x && x < values.x+size/2 && values.y-size/2 < y && y < values.y+size/2)
      id = values.id;
  });
  return id;
}
