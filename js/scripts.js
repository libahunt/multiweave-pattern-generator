
$(function() {

  //TODO detect if new or existing pattern
  //TODO when save functionality gets created, load pattern from json Pattern.loadFromJSON()
  //TODO Pattern.drawExisting() if loading saved pattern

	//Initialize new pattern object
	pattern = new Pattern(12,15);
  //TODO make pattern Wefts layout size choosable for new patterns
  //Draw new pattern.
  pattern.drawNew();

  
  //Interface CSS update
	$("#pattern, #layerWeaves")
		.css('width', pattern.canvasWidth+ 'px')
		.css('height', pattern.canvasHeight+ 'px');
	$("#work-area")
		.css('width', (pattern.canvasWidth + 2) + 'px');



	/**
	 * Buttons event handlers
	 */
	$('#endWarping').on('click', endWarping);
	$('#undo').on('click', ctrlZ);
	$('#newLayer').on('click', newLayer);
  $('#generateGcode').on('click', generateGCode);

});









function arcProperties(point1, point2, commonWarp) {
	var direction;
	for (var i=0; i<6; i++) {
		var point1index, point2index;
		if (commonWarp.points[i] == point1) {
			point1index = i;
		}
		else if (commonWarp.points[i] == point2) {
			point2index = i;
		}
	}
	if (point1index-point2index > 0) {
		if (point1index-point2index <= 2) {
			direction = 'ccw';
		}
		else {
			direction = 'cw';
		}
	}
	else {
		if(point1index-point2index >= -2) {
			direction = 'cw';
		}
		else {
			direction = 'ccw';
		}
	}
	var extraPoints = [];
	var nextP = nextPoint(point1, commonWarp, direction);
	if (nextP != point2) { //next point is not yet destination
		extraPoints.push(nextP);//add to array
		//and check for one more point
		nextP = nextPoint(nextP, commonWarp, direction);
		if (nextP != point2) {
			extraPoints.push(nextP);
		};
	};
	return {
		'direction': direction,
		'extraPoints': extraPoints
	};
}

function nextPoint(point, commonWarp, direction) {
	var pointIndex;
	if (direction == 'cw') {
		pointIndex = commonWarp.points.indexOf(point) + 1;
		if (pointIndex == 6) pointIndex = 0;
	}
	else {
		pointIndex = commonWarp.points.indexOf(point) - 1;
		if (pointIndex == -1) pointIndex = 5;
	}
	return commonWarp.points[pointIndex];
}



/**
 * "End warping" button functionality
 */

function endWarping() {
	//Check which warps were selected for use, generate points to them, remove others
	for(var i=0; i<pattern.warps.length; i++) {
		pattern.warps[i].div.off('click');
		if (!pattern.warps[i].use) {
			pattern.warps[i].div.remove();
		}
		else {
			pattern.warps[i].generatePoints(pattern);
		}
	}
	//Show buttons and instructions that are relevant in wefting phase
	$('#pattern').removeClass('prewarping');
	$('#undo').show();
	$('#newLayer').show();
	$('#prewarping-instruction').hide();
	$('#weaving-instruction').show();
	$('#gcode').html('G90 \n');
	$('#gcode-wrapper').show();
	$(this).hide();
}













function lastElementOf(arr) {
	return arr[arr.length-1];
}
