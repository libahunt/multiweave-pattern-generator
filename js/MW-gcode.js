/**
 * "Generate g-code" button functionality
 */

var gx, gy,layerThickness, boardXmargin, boardYmargin, currentLayerBaseHeight;

function generateGCode() {

  $('#gcode').html('');

  gx = $('#weft-distance').val() / pattern.warpSpacingX;
  gy = Math.sqrt(Math.pow(gx,2) - Math.pow(gx/2,2));
  layerThickness = parseFloat($('#layer-thickness').val());
  currentLayerBaseHeight = parseFloat($('#bottom-layer').val());
  boardXmargin = parseFloat($('#board-left').val());
  boardYmargin = parseFloat($('#board-bottom').val());



  $('#gcode').html($('#gcode').html() + 'G90 \n'); //assure absolute coordinates

  var currentSubLayer = 0;

  for (var i=0; i<pattern.steps.length; i++) { //User chosen layers
    var moveCounter = 0;//keep track of user steps for gcode comments (for debugging)
    //Helper variables for continuous arcs
    var continuousArc = false;
    var arcStartPoint;
    var stepNumbers = [];

    for (var j=0; j<pattern.steps[i].length; j++) { //Steps in a layer
      var thisStep = pattern.steps[i][j];
      var nextStep = pattern.steps[i][j+1];

      if (i==0 && j==0) { //very first step is the choice of the start point, move there in a straight line
        gcodeComment('Layer 0, move 0');
        gcodeLine(null, null, 0); //Z height adjustment first
        gcodeLine(
          pattern.steps[i][j].EndPoint.x,
          pattern.steps[i][j].EndPoint.y,
          null
        ); //XY movement
        moveCounter++;
      }

      else if (j==0) { //this step marks the beginning of new layer, z movement only

        //Calculate the new layer base from last layer sublayers number
        currentLayerBaseHeight += pattern.sublayers[i-1] * layerThickness + layerThickness;
        //Generate g-code
        gcodeComment('Layer ' + i +', move 0');
        gcodeLine(null, null, 0);
        moveCounter++;
      }

      else if (pattern.steps[i][j].lineType == 'arc') {

        //Not currently in the middle of a continuos arc
        if (!continuousArc) {

          //If the just started arc continues in next step
          if (nextStep !== undefined &&
              nextStep.lineType == 'arc' &&
              nextStep.arcDir == thisStep.arcDir &&
              nextStep.Warp == thisStep.Warp &&
              nextStep.sublayer == thisStep.sublayer) {
            continuousArc = true;
            arcStartPoint = thisStep.StartPoint;
            stepNumbers.push(moveCounter);
            moveCounter++;
          }

          //This step is the whole arc
          else {
            gcodeComment('Layer ' + i +', move ' + moveCounter);
            if (thisStep.sublayer != currentSubLayer) {
              currentSubLayer = thisStep.sublayer;
              gcodeLine(null, null, currentSubLayer);

            }
            gcodeArc(thisStep.StartPoint, thisStep.EndPoint, thisStep.Warp, thisStep.arcDir);
            moveCounter++;
          }


        }

        else { //We are in the middle of a multi part arc

          //If the arc still continues
          if (nextStep !== undefined &&
              nextStep.lineType == 'arc' &&
              nextStep.arcDir == thisStep.arcDir &&
              nextStep.Warp == thisStep.Warp &&
              nextStep.sublayer == thisStep.sublayer) {
            //Just check if a user command counter should be incremented
            if (thisStep.startOfUserCommand) {
              stepNumbers.push(moveCounter);
              moveCounter++;
            }
          }
          //Arc ends here, write down the g-code
          else {
            //Check if a user command counter should be incremented
            if (thisStep.startOfUserCommand) {
              stepNumbers.push(moveCounter);
              moveCounter++;
            }
            gcodeComment('Layer ' + i +', move ' + stepNumbers.toString());
            if (thisStep.sublayer > currentSubLayer) {
              currentSubLayer = thisStep.sublayer;
              gcodeLine(null, null, currentSubLayer);
            }
            gcodeArc(arcStartPoint, thisStep.EndPoint, thisStep.Warp, thisStep.arcDir);
            moveCounter++;
            continuousArc = false;
            arcStartPoint = undefined;
          }
        }
      }

      else { //lineType == 'line'
        gcodeComment('Layer ' + i +', move ' + moveCounter);
        if (thisStep.sublayer != currentSubLayer) {
          currentSubLayer = thisStep.sublayer;
          gcodeLine(null, null, currentSubLayer);
          moveCounter++;
        }

      }

    }

    currentSubLayer = 0;//Reset the sublayer for next user selected main layer

  }

  $('#gcode').show();

}



/**
 * Helper functions
 */

function gcodeComment(commentString) {
  $('#gcode').html($('#gcode').html() + '(' +  commentString +  ')\n');
}

function gcodeLine(pointX, pointY, subLayerNo) {

  var returnString = 'G00';
  if (pointX !== null) {
    returnString += ' X' + (gcodeXcoord(pointX));
  }
  if (pointY !== null) {
    returnString += ' Y' + ( gcodeYcoord(pointY));
  }
  if (subLayerNo !== null) {
      returnString += ' Z' + (currentLayerBaseHeight + subLayerNo*layerThickness);
  }
  returnString += ' \n';

  $('#gcode').html( $('#gcode').html() + returnString );

  //G00 X#.#### Y#.#### Z#.#### //maximum feed rate
  //G01 X#.#### Y#.#### Z.#.#### F#.####
}



function gcodeArc(point1, point2, commonWarp, direction) {
  var returnString = 'G';
  if (direction=='cw') {
    returnString += '02 ';
  }
  else {
    returnString += '03 ';
  }
  returnString += ('X' + gcodeXcoord(point2.x) + ' ');
  returnString += ('Y' + gcodeYcoord(point2.y) + ' ');
  returnString += ('I' + ( gcodeXcoord(commonWarp.x) - gcodeXcoord(point1.x) ) + ' ');
  returnString += ('J' + ( gcodeYcoord(commonWarp.y) - gcodeYcoord(point1.y) ) + ' \n');
  //'F#';//F feed rate ... (inch/min)
  $('#gcode').html( $('#gcode').html() + returnString );
}

function gcodeXcoord(coord) {
  return (coord-pattern.canvasEdge)*gx + boardXmargin;
}

function gcodeYcoord(coord) {
  return (pattern.canvasHeight-coord-pattern.canvasEdge)*gy + boardYmargin; //Y coordinates are mirrored in html vs gcode
}
