/* Header click functions */
function mapHeaderClick(){
  headerClick("map");
}
function dataHeaderClick(){
  headerClick("data");
}
function sqlHeaderClick(){
  headerClick("sql");
}
function headerClick(type){
  $("#map, #data, #sql").hide();
  $("#mapHeader, #dataHeader, #sqlHeader").removeClass("highlight");
  $("#"+type).show()
  $("#"+type+"Header").addClass("highlight");
}

/* Save offsets functions */
function saveOffsetsCar(){
  saveOffsets("car")
}
function saveOffsetsDrone(){
  saveOffsets("drone")
}
function saveOffsetsRobot(){
  saveOffsets("robot")
}
function saveOffsets(type){
  $.each(maps, function(key, values){
    if(values.id == currentMapId){
      values.offSetX = toIntOrZero($("#"+type+"OffSetX").val());
      values.offSetY = toIntOrZero($("#"+type+"OffSetY").val());
    }
  })
  refresh();
}

/* Copy functions */
function copyDataJs(){
  copy("datajs");
}
function copyJson(){
  copy("json");
}
function copyTopSql(){
  copy("topSql");
}
function copyCarSql(){
  copy("carSql");
}
function copyDroneSql(){
  copy("droneSql");
}
function copyRobotSql(){
  copy("robotSql");
}
function copy(element){
  $("#"+ element).select();
  document.execCommand('copy');
}
