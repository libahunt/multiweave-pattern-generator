/**
 * "Generate g-code" button functionality
 */

function generateGCode() {
  //TODO
  /*
   //Generate Gcode
   $('#gcode').html($('#gcode').html() +
   gcodeArc(point1, point2, commonWarp, arcProps.direction, Zheight)
   );

   //Generate Gcode
   $('#gcode').html($('#gcode').html() + gcodeLine(point1, point2, Zheight));
   */
  $('#gcode').show();
}


/**
 * Helper functions
 */

function gcodeLine(point1, point2, Zheight) {
  return  '('+pattern.userMoveNo+')\n' +
      'G00 X' +  point1.gx + ' Y' + point1.gy + ' Z' + Zheight + ' \n' +
      'G00 X' +  point2.gx + ' Y' + point2.gy + ' Z' + Zheight + ' \n';
  //G00 X#.#### Y#.#### Z#.#### //maximum feed rate
  //G01 X#.#### Y#.#### Z.#.#### F#.####
}

function gcodeArc(point1, point2, commonWarp, direction, Zheight) {
  var result = '('+pattern.userMoveNo+')\n' +
      'G00 X' +  point1.gx + ' Y' + point1.gy + ' Z' + Zheight + ' \n' +
      'G';
  if (direction=='cw') {
    result += '02 ';
  }
  else {
    result += '03 ';
  }
  result += ('X' + point2.gx + ' ');
  result += ('Y' + point2.gy + ' ');
  result += ('I' + (commonWarp.gx - point1.gx) + ' ');
  result += ('J' + (commonWarp.gy - point1.gy) + ' \n');
  //result += 'F#';//F feed rate ... (inch/min)
  return result;
}