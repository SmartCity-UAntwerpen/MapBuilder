var top_databasename = "backbone";
var top_tablename_point = "point";
var top_tablename_link = "link";

var car_databasename = "car";
var car_tablename_point = "points";

var drone_databasename = "drone"
var drone_tablename_point = "points";
//var drone_tablename_link = "link";

var robot_databasename = "robotDB_new";
var robot_tablename_tile = "tiles";
var robot_tablename_point = "points";
var robot_tablename_link_lock = "link_locks";
var robot_tablename_link = "links";


function displaySQL(){
  $("#topSql").val(getSQL_top())
  $("#carSql").val(getSQL_car())
  $("#droneSql").val(getSQL_drone())
  $("#robotSql").val(getSQL_robot())
}

function getSQL_top(){

  var sql = "USE  " + top_databasename + ";";

  //Point table
  sql += "\nDROP TABLE " + top_tablename_point + ";";
  sql += "\nCREATE TABLE " + top_tablename_point +"(id int, pid int, mapid int);";
  $.each(top_nodes, function(key,values){
    sql += "\nINSERT INTO " + top_tablename_point + " VALUES(" + values.id + "," + values.edgeId + "," + values.mapId + ");"
  });

  //Link table
  sql += "\nDROP TABLE " + top_tablename_link + ";";
  sql += "\nCREATE TABLE " + top_tablename_link + "(id int, startid int, stopid int, weight int);";
  $.each(top_links, function(key,values){
    sql += "\nINSERT INTO " + top_tablename_link + " VALUES(" + values.id + "," + values.start + "," + values.stop + "," + values.weight + ");"
  });

  return sql;
}

function getSQL_car(){

  var sql = "USE " + car_databasename + ";";

  //Create table
  sql += "\nDROP TABLE " + car_tablename_point + ";";
  sql += "\nCREATE TABLE " + car_tablename_point +"(id int, x float, y float, z float, w float, mapname varchar(255));";

  //Fill table
  $.each(car_nodes, function(key,values){
    sql += "\nINSERT INTO " + car_tablename_point + " VALUES" + "(" + values.id + ","  + values.car_x + ","
        + values.car_y + "," + values.car_z + "," + values.car_w + ",\"" + values.mapname + "\");"
  });

  return sql;
}

function getSQL_drone(){

  var sql = "USE " + drone_databasename + ";";

  sql += "\nDROP TABLE " + drone_tablename_point + ";";
  sql += "\nCREATE TABLE " + drone_tablename_point +"(pointID int, x float, y float, z float);";
  $.each(drone_nodes, function(key,values){
    sql += "\nINSERT INTO " + drone_tablename_point + " VALUES(" + values.id + "," + values.drone_x + "," + values.drone_y + "," + values.drone_z + ");"
  });

  //Link table
  // sql += "\nDROP TABLE " + drone_tablename_link + ";";
  // sql += "\nCREATE TABLE " + drone_tablename_link + "(linkid int, begin int, end int, weight int);";
  // $.each(drone_links, function(key,values){
  //   sql += "\nINSERT INTO " + drone_tablename_link + " VALUES(" + values.id + "," + values.start + "," + values.stop + "," + values.weight + ");"
  // });
  return sql
}

function getSQL_robot(){

  var sql = "USE " + robot_databasename + ";";


  //tiles
  var tiles = [];
  $.each(robot_tiles, function(key,values){
    if(values.isTile){
      tiles.push(values)
    }
  })

  $.each(tiles, function(key,values){
    sql += "INSERT INTO " + robot_databasename + "." + robot_tablename_tile + "(id, rfid, is_locked, tiles.type) VALUES(" +
            values.tileId + ",\"" + values.rfid + "\"," + 0 + ",\"" + values.tiletype + "\");\n"
  })

  //nodes - only nodes who have links
  var used_nodes = []
  $.each(robot_links, function(key,values){
    used_nodes.push(values.start);
    used_nodes.push(values.stop);
  })

  $.each(robot_nodes, function(key,values){
    if(used_nodes.includes(values.id)){
      sql += "INSERT INTO " + robot_databasename + "." + robot_tablename_point + "(id, tile_id) VALUES(" +
            values.id + "," + values.tileId + ");\n"
    }
  })


  //links
  var sql2 = ""
  var tile_combinations = []
  $.each(robot_links, function(key,values){

    var combination = (values.startTile <= values.stopTile)? [values.startTile,values.stopTile]:[values.stopTile,values.startTile]

    var allowed = true;
    if(tile_combinations.length > 0){
      $.each(tile_combinations, function(k,v){
        if((v[0] == combination[0] & v[1] == combination[1])){
          allowed = false;
        }
      })
    }

    if(allowed){
      tile_combinations.push(combination);
    }

    var link_lock_id = 1;

    $.each(tile_combinations, function(k,v){
      if((v[0] == combination[0] & v[1] == combination[1])){
        link_lock_id = k+1;
      }
    })

    //get key of combination
    sql2 += "INSERT INTO " + robot_databasename + "." + robot_tablename_link +
            "(id, start, end, weight, angle, link_lock_id, length) VALUES(" +
              values.id + "," + values.start + "," + values.stop + "," +
              values.weight + "," + values.angle + "," + link_lock_id  + ","+ values.length +");\n"

  })


  for (var i = 1; i <= tile_combinations.length; i++) {
    sql += "INSERT INTO " + robot_databasename + "." + robot_tablename_link_lock + "(id, status) VALUES(" + i + "," + 0 +");\n"
  }

  return sql+sql2
}
