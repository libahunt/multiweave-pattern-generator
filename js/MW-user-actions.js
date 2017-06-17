
/**
 * route() - clicking on a point calls this function.
 * Takes two point objects as parameters and routes the path from first to second.
 * Decides if the path is straight or arc.
 * Finds the sub layer (symbolic height higher than the previously crossing threads).
 * Draws SVG lines.
 * Adds Step object into pattern.steps array.
 */
function route(point1, point2) {
  //TODO refactor some pieces out from here

  pattern.userMoveNo++;

  //Find out if points have an owner warp in common do detect if arc or line
  var commonWarp = undefined;
  for (var i=0; i<point1.ownerWarps.length; i++) {

    for (var j=0; j<point2.ownerWarps.length; j++) {
      if (point1.ownerWarps[i] == point2.ownerWarps[j]) {
        commonWarp = point1.ownerWarps[i];
        break;
      }
    }
  }

  var lineType = 'line';
  if (commonWarp != undefined) lineType = 'arc';



  //Points did have a warp in common, the path will be arc
  if (lineType === 'arc') {

    //Get the direction of arc - works reliably if arch is 1 or 2 point distances long.
    var arcProps = arcProperties(point1, point2, commonWarp);

    //Initially choose sublayer according to start point's entry height.
    var thisStepSublayer = lastElementOf(point1.sublayers[pattern.currentLayer])[0];
    //Compare sublayer number to other points that the path will cross.
    for (var i=0; i<arcProps.extraPoints.length; i++) {
      if (arcProps.extraPoints[i].sublayers[pattern.currentLayer].length > 0 && lastElementOf(arcProps.extraPoints[i].sublayers[pattern.currentLayer])[1] + 1 > thisStepSublayer) {
        thisStepSublayer = lastElementOf(arcProps.extraPoints[i].sublayers[pattern.currentLayer])[1] + 1;
      }
    }
    if (point2.sublayers[pattern.currentLayer].length > 0 && lastElementOf(point2.sublayers[pattern.currentLayer])[1] + 1 > thisStepSublayer) {
      thisStepSublayer = lastElementOf(point2.sublayers[pattern.currentLayer])[1] + 1;
    }

    //Update each point's sublayer height
    point1.sublayers[pattern.currentLayer][point1.sublayers[pattern.currentLayer].length-1][1] = thisStepSublayer;
    for (var i=0; i<arcProps.extraPoints.length; i++) {
      arcProps.extraPoints[i].sublayers[pattern.currentLayer].push([thisStepSublayer, thisStepSublayer]);
    }
    point2.sublayers[pattern.currentLayer].push([thisStepSublayer, null]);


    //Put every piece of the arc separately into pattern.steps array
    var isStart = true;
    var lastPoint = point1;

    for (i=0; i<arcProps.extraPoints.length; i++) {
      pattern.steps[pattern.steps.length-1].push(new Step(lastPoint, arcProps.extraPoints[i], 'arc', arcProps.direction, commonWarp, thisStepSublayer, isStart));
      isStart = false;
      lastPoint = arcProps.extraPoints[i];
    }

    pattern.steps[pattern.steps.length-1].push(new Step(lastPoint, point2, 'arc', arcProps.direction, commonWarp, thisStepSublayer, isStart));


    //Draw line on screen
    drawSvgArc(point1, point2, commonWarp, arcProps.direction);

  }


  //Points don't have a common warp, the path will be straight line
  else {

    //Initially choose sublayer according to start point's entry height.
    var thisStepSublayer = lastElementOf(point1.sublayers[pattern.currentLayer])[0];
    //Check for end point height.
    if (point2.sublayers[pattern.currentLayer].length > 0 && lastElementOf(point2.sublayers[pattern.currentLayer])[1] + 1 > thisStepSublayer) {
      thisStepSublayer = lastElementOf(point2.sublayers[pattern.currentLayer])[1] + 1;
    }
    //TODO check straight lines intersections with each other
    //checkLineIntersection(line1.startX, line1.startY, line1.endX, line1.endY, line2.startX, line2.startY, line2.endX, line2.endY);

    //Update each point's sublayer height
    point1.sublayers[pattern.currentLayer][point1.sublayers[pattern.currentLayer].length-1][1] = thisStepSublayer;
    point2.sublayers[pattern.currentLayer].push([thisStepSublayer, null]);

    //Put the line path into pattern.steps array
    pattern.steps[pattern.steps.length-1].push(new Step(point1, point2, 'line', null, null, thisStepSublayer, true));

    //Draw line on screen
    drawSvgLine(point1, point2);

  }

  //Update CSS indication of current point where the thread is.
  point1.div.removeClass('current');
  point2.div.addClass('current');

}



/**
 * "New layer" button functionality
 */

function newLayer() {

  //TODO calculate pattern.sublayers element for previous layer, if this is needed...

  pattern.currentLayer++;
  pattern.userMoveNo++;//TODO is this needed? used in ctrlZ detecting first step

  //Add a step with no start point into pattern.steps new layer element (will be converted to z raise movement in gcode)
  pattern.steps.push([new Step(lastElementOf(lastElementOf(pattern.steps)).EndPoint, lastElementOf(lastElementOf(pattern.steps)).EndPoint, null, null, null, 0, true)]);

  //Add elements to sublayers counters
  for (i=0; i<pattern.crossingPoints.length; i++) {
    pattern.crossingPoints[i].sublayers.push([]);
  }
  //Add "0" level value to layer's start point
  pattern.steps[pattern.currentLayer][0].StartPoint.sublayers[pattern.currentLayer].push([0, null]);

  //Make drawings of previous layers in the UI more transparent
  $('.layer'+(pattern.currentLayer-1)).each(function() {
    $(this).attr('stroke-opacity','0.3');
  });
  $('.layer'+(pattern.currentLayer-2)).each(function() {
    $(this).attr('stroke-opacity','0.08');
  });

  //Show new layer number in UI
  $('#layer-indicator').html(pattern.currentLayer);

}



/**
 * "Undo" button functionality
 */
function ctrlZ() {

  //Ignore when no content is created
  if (pattern.userMoveNo==0) {
    return;
  }

  var hadThisLayerSteps = false;
  try {
    if (pattern.steps[pattern.steps.length-1].length > 1) {//Steps from point to point on same layer exist

      //Remove step from pattern.steps array, repeat til the start of that user command.
      var startOfMoveDeleted = false;
      do {
        startOfMoveDeleted = lastElementOf(lastElementOf(pattern.steps)).startOfUserCommand;
        pattern.steps[pattern.steps.length-1].pop(); //remove step
      }
      while (!startOfMoveDeleted);

      //Delete SVG drawing
      document.getElementById('layerWeaves').removeChild(document.getElementById('pathshadow'+pattern.userMoveNo));
      document.getElementById('layerWeaves').removeChild(document.getElementById('path'+pattern.userMoveNo));

      //Move the active color of thread position to last step's point.
      $('.point.current').removeClass('current');
      if (pattern.userMoveNo>1) {
        lastElementOf(lastElementOf(pattern.steps)).EndPoint.div.addClass('current');
      }

      hadThisLayerSteps = true;
    }
  }
  catch(err) {
    alert("Can't undo");
    return;
  }

  if (!hadThisLayerSteps) {//No steps on this layer. Step back to previous layer (delete current one)
    try {
      if (pattern.currentLayer > 0) {//First layer with start point is special case
        pattern.currentLayer--;

        //Make drawings of now active previous layer opaque again
        $('.layer'+(pattern.currentLayer)).each(function() {
          $(this).attr('stroke-opacity','1');

        });
        $('.layer'+(pattern.currentLayer-1)).each(function() {
          $(this).attr('stroke-opacity','0.3');
        });

      }
      else {
        //The to be removed step was choice of start point, remove the "start" mark from canvas
        $('.point.start').removeClass('start').removeClass('current');
      }

      //Remove the layer element from pattern.steps array
      pattern.steps.pop();
      //Update layer counter in the UI
      $('#layer-indicator').html(pattern.currentLayer);

    }
    catch(err) {
      alert("Can't undo");
      return;
    }
  }

  pattern.userMoveNo--;

}