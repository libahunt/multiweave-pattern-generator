
var Pattern = function() {
	//Pattern size as number of warps in a row and number of zig-zag shifted rows
	this.noOfWarpsX = 12;
	this.noOfWarpsY = 15;
		
	//Measurements in real world, in mm, for gcode
	this.warpSpacingGX = 15.588457;
	this.warpSpacingGY = Math.sqrt(Math.pow(this.warpSpacingGX,2) - Math.pow(this.warpSpacingGX/2,2));
	this.edgeLeftG = this.warpSpacingGX;
	this.edgeBottomG = this.warpSpacingGX;
	this.boardWidth = (this.noOfWarpsX-1) * this.warpSpacingGX + 2.5*this.edgeLeftG;
	this.boardHeight = (this.noOfWarpsY-1) * this.warpSpacingGY + 2*this.edgeBottomG;
	this.layerHeight = 5;//TODO: how to decide needed height?

	//Measuremants on browser canvas, px
	this.warpSpacingX = 60;
	this.warpSpacingY = Math.sqrt(Math.pow(this.warpSpacingX,2) - Math.pow(this.warpSpacingX/2,2));
	this.coef = this.warpSpacingX / this.warpSpacingGX; //helper
	this.r = this.warpSpacingX / 2;
	this.edgeLeft = this.edgeLeftG * this.coef;
	this.edgeBottom = this.edgeBottomG * this.coef;
	this.canvasWidth = (this.noOfWarpsX-1) * this.warpSpacingX + 2.5*this.edgeLeft;
	this.canvasHeight = (this.noOfWarpsY-1) * this.warpSpacingY + 2*this.edgeBottom;

	//Array of possible warp positions objects
	this.warps = [];
	//Array of crossing points e.g "buttons" on the path
  this.crossingPoints = [];

  //Array to save all chosen points, this allows to take back some part of path.
  this.crossingPointsHistory = [[]]; //array for each layer
  //Element will hold the point object that was crossed and the step number

  //Keep track of creation step (each clicked point is a step)
  this.step = 0;
  //Keep track of current layer number
  this.layer = 0;
  //Keep track of each layer's "base" height. Next layer's possible height is updated on every routing operation.
  this.layersBottomZs = [0, 0];

  //Helper to calculate crossingpoints from warp coordinates
  this.pointsOffsets = function(spacingX, spacingY) {
		return [
			[	-1*spacingX/4, -1*spacingY/2],
			[	   spacingX/4, -1*spacingY/2],
			[		 spacingX/2, 	0],
			[		 spacingX/4,	spacingY/2],
			[	-1*spacingX/4, 	spacingY/2],
			[	-1*spacingX/2, 	0],
		];
	}

	this.startPoint = new Point(this.edgeLeft/2, this.canvasHeight-this.edgeBottom/2, null, this);
  this.crossingPointsHistory[0].push([this.startPoint, 0]);
	this.startPoint.draw();
	this.startPoint.div.addClass('start');
}

Pattern.prototype.lastPoint = function() {
	return this.crossingPointsHistory[this.crossingPointsHistory.length-1][this.crossingPointsHistory[this.crossingPointsHistory.length-1].length-1];
};

Pattern.prototype.currentLayerZ = function() {
	return this.layersBottomZs[this.layer];
};




/**
 * Warps
 */
var Warp = function(x, y, use) {
	this.gx = x/pattern.coef;
  this.gy = pattern.boardHeight - y/pattern.coef;
  this.x = x;
  this.y = y;
  this.use = use;
  this.div = undefined;
  this.points = [];
}

Warp.prototype.draw = function() {
	var obj = this;
  var div = $('<div></div>')
    .css('left', this.x+'px')
    .css('top', this.y+'px')
    .addClass('warp')
    .on('click', function() {
    	obj.toggleUse();
    });
  if (this.use) {
  	div.addClass('use');
  }
  if (this.div == undefined) {
  	$('#pattern').append(div);
  	this.div = div;
  }
  else {
  	if (use) {
  		this.div.removeClass('use');
  	}
  	else {
  		this.div.addClass('use');
  	}	    	
  }
}

Warp.prototype.toggleUse = function() {
	this.use = !this.use;
	if (this.use) {
		this.div.addClass('use');
	}
	else {
		this.div.removeClass('use');
	}
}

Warp.prototype.hide = function() {
	this.div.addClass('hidden');
}

Warp.prototype.generatePoints = function(pattern) {
	//Generate crossing-points - these are the enter and exit points from a "button".
	var htmlPointsOffsets = pattern.pointsOffsets(pattern.warpSpacingX, pattern.warpSpacingY);
	var gcodePointsOffsets = pattern.pointsOffsets(pattern.warpSpacingGX, pattern.warpSpacingGY);
	for (var i=0; i<6; i++) {
		var x = this.x + htmlPointsOffsets[i][0];
		var y = this.y + htmlPointsOffsets[i][1];
		var pointExists = false;
		for (var j=0; j<pattern.crossingPoints.length; j++) {
			if(pattern.crossingPoints[j].x == x && pattern.crossingPoints[j].y == y) {
				pointExists = true;
				pattern.crossingPoints[j].ownerWarps.push(this);
				this.points.push(pattern.crossingPoints[j]);
			}
		}
		if (!pointExists) {
			var newPoint = new Point(x, y, this, pattern);
			newPoint.draw();
			pattern.crossingPoints.push(newPoint);
			this.points.push(pattern.crossingPoints[pattern.crossingPoints.length-1]);
		}
	}
}

/**
 * Points are inbetween warps, weft thread passes through them.
 */
var Point = function(x, y, ownerWarp0, pattern) {
	this.x = x;
	this.y = y;
	this.gx = x/pattern.coef;
	this.gy = pattern.boardHeight - y/pattern.coef;
	this.gz = 0; //holds the currently topmost weft thread height
	this.ownerWarps = [ownerWarp0];
	this.div = undefined;
}

Point.prototype.draw = function() {
	var obj = this;
	var div = $('<a></a>')
		.css('left', this.x+'px')
		.css('top', this.y+'px')
		.addClass('point')
		.on('click', function() {
			if (pattern.step == 0) {
				$('.point.start').off('click');
			}
			route(
				pattern.lastPoint()[0],
				obj
			);
		});
	$('#pattern').append(div);
	this.div = div;
}





$(function() {

	//Initialize pattern object
	pattern = new Pattern();

	//TODO: when save functionality gets created, load pattern from json


	/**
	 * Generate possible warps grid for new pattern
	 */
	for (var i=0; i<pattern.noOfWarpsY; i++) {
		var rowOffsetX = 0;
		if (i%2!=0) {
			rowOffsetX = pattern.warpSpacingX/2;
		}
		for (var j=0; j<pattern.noOfWarpsX; j++) {
			var warp = new Warp (
				pattern.edgeLeft + j*pattern.warpSpacingX + rowOffsetX,
				pattern.edgeBottom  + i*pattern.warpSpacingY,
				false
			);
			warp.draw();
			pattern.warps.push(warp);
		}
	}
	//TODO: if loading existing pattern in warping state, read the ".use" values
	//TODO: if loading existing pattern in wefting state, only create warps that are in use
  

	$("#pattern, #layerWeaves")
		.css('width', pattern.canvasWidth+ 'px')
		.css('height', pattern.canvasHeight+ 'px');
	$("#work-area")
		.css('width', (pattern.canvasWidth + 2) + 'px');



	/**
	 * Buttons
	 */
	$('#endWarping').on('click', endWarping);
	$('#undo').on('click', ctrlZ);
	$('#newLayer').on('click', newLayer);

});



/**
 * route() - clicking on a point calls this function.
 * Takes two point objects as parameters and routes the path from first to second.
 * Decides if the path is straight or arc. 
 * Decides z-height for the movement.
 * Generates g-code.
 * Draws SVG lines.
 * Updates all related objects.
 */
function route(point1, point2) {

	pattern.step++;
	//Find out if points have an owner warp in common
	var commonWarp = undefined;
	for (var i=0; i<point1.ownerWarps.length; i++) {
		for (var j=0; j<point2.ownerWarps.length; j++) {
			if (point1.ownerWarps[i] == point2.ownerWarps[j]) {
				commonWarp = point1.ownerWarps[i];
				break;
			}
		}
	}

	//First part of finding Z height
	var Zheight = pattern.currentLayerZ();
	if (point1.gz > Zheight) Zheight = point1.gz;

	//Points have a warp in common, the path will be arc
	if (commonWarp != undefined) {

		//Get the direction of arc - works reliably if arch is 1 or 2 point distances long
		var arcProps = arcProperties(point1, point2, commonWarp);

		//Comparing Z height to other points that the path will cross
		for (var i=0; i<arcProps.extraPoints.length; i++) {
			if (arcProps.extraPoints[i].gz + pattern.layerHeight > Zheight) Zheight = arcProps.extraPoints[i].gz + pattern.layerHeight;
		}
		if (point2.gz + pattern.layerHeight > Zheight) Zheight = point2.gz + pattern.layerHeight;
		
		//Add new points to history array and update each point's Z height
		point1.gz = Zheight;
		for (var i=0; i<arcProps.extraPoints.length; i++) {
			pattern.crossingPointsHistory[pattern.layer].push([arcProps.extraPoints[i], pattern.step]);
			arcProps.extraPoints[i].gz = Zheight;
		}
		pattern.crossingPointsHistory[pattern.layer].push([point2, pattern.step]);
		if (point2.gz == pattern.currentLayerZ()) point2.gz = pattern.currentLayerZ() + pattern.layerHeight;

		//Generate Gcode
		$('#gcode').html($('#gcode').html() + 
			gcodeArc(point1, point2, commonWarp, arcProps.direction, Zheight)
		);

		//Draw line on screen
		drawSvgArc(point1, point2, commonWarp, arcProps.direction);

	}

	//Points don't have a common warp, the path will be straight line
	else {

		//Compare Z height to end point too
		if (point2.gz + pattern.layerHeight > Zheight) Zheight = point2.gz + pattern.layerHeight;

		//Update each point's Z height
		point1.gz = Zheight;
		if (point2.gz == pattern.currentLayerZ()) point2.gz = pattern.currentLayerZ() + pattern.layerHeight;

		//Add new point to history array
		pattern.crossingPointsHistory[pattern.layer].push([point2, pattern.step]);

		//Generate Gcode
		$('#gcode').html($('#gcode').html() + gcodeLine(point1, point2, Zheight));

		//Draw line on screen
		drawSvgLine(point1, point2);
	}

	//Keep track of layer's highest point so far, next layer's base will depend on it
	if (Zheight >= pattern.layersBottomZs[pattern.layer + 1]) {
		pattern.layersBottomZs[pattern.layer + 1] = Zheight + pattern.layerHeight;
	}

}




/**
 * Helper functions for route()
 */

function gcodeLine(point1, point2, Zheight) {
	return  '('+pattern.step+')\n' +
		'G00 X' +  point1.gx + ' Y' + point1.gy + ' Z' + Zheight + ' \n' +
		'G00 X' +  point2.gx + ' Y' + point2.gy + ' Z' + Zheight + ' \n';
	//G00 X#.#### Y#.#### Z#.#### //maximum feed rate
	//G01 X#.#### Y#.#### Z.#.#### F#.####
}

function gcodeArc(point1, point2, commonWarp, direction, Zheight) {
	var result = '('+pattern.step+')\n' +
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

function drawSvgLine(point1, point2) {
  var line = makeSVG('line', {
  	x1: point1.x, 
  	y1: point1.y, 
  	x2: point2.x, 
  	y2: point2.y,
    'stroke': 'rgba(255,255,255,0.85)', 
    'stroke-width': 8,
 	  'id': 'pathshadow'+pattern.step,
    'class': 'layer'+pattern.layer
 	});
 	document.getElementById('layerWeaves').appendChild(line);
  line = makeSVG('line', {
  	x1: point1.x, 
  	y1: point1.y, 
  	x2: point2.x, 
  	y2: point2.y,
    stroke: '#ff3300', 
    'stroke-width': 2,
    'id': 'path'+pattern.step,
    'class': 'layer'+pattern.layer
  });
  document.getElementById('layerWeaves').appendChild(line);
}

function drawSvgArc(point1, point2, commonWarp, direction) {
	var flag = 0;
	if (direction == 'cw') {
		flag = 1;
	}
	//First path is a "shadow"
	var path = 'M '+point1.x+' '+point1.y+' A '+pattern.r+' '+pattern.r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  var arc = makeSVG('path', {d: path,
    'stroke': 'rgba(255,255,255,0.85)', 
    'stroke-width': 8, 
    'fill': 'transparent',
    'id': 'pathshadow'+pattern.step,
    'class': 'layer'+pattern.layer
  });
  document.getElementById('layerWeaves').appendChild(arc);
  //Second path is colored line
  path = 'M '+point1.x+' '+point1.y+' A '+pattern.r+' '+pattern.r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  arc = makeSVG('path', {d: path,
    'stroke': '#ff3300', 
    'stroke-width': 2, 
    'fill': 'transparent',
    'id': 'path'+pattern.step,
    'class': 'layer'+pattern.layer
  });
  document.getElementById('layerWeaves').appendChild(arc);
}

function makeSVG(tag, attrs) { //http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)  
    el.setAttribute(k, attrs[k]);
  return el;
}

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



/**
 * "New layer" button functionality
 */

function newLayer() {
	pattern.step++;
	pattern.layer++;
	pattern.crossingPointsHistory.push([pattern.lastPoint()]);
	$('.layer'+(pattern.layer-1)).each(function() {
		$(this).attr('stroke-opacity','0.3');

	});
	$('.layer'+(pattern.layer-2)).each(function() {
		$(this).attr('stroke-opacity','0.08');
	});
	var initialNextZ = pattern.layersBottomZs[pattern.layersBottomZs.length - 1] + pattern.layerHeight;
	pattern.layersBottomZs.push(initialNextZ);
	$('#gcode').html($('#gcode').html() + 
		'('+pattern.step+' new layer) \n' +
		'G00 X' +  pattern.lastPoint()[0].gx + ' Y' + pattern.lastPoint()[0].gy + ' Z' + pattern.layersBottomZs[pattern.layer] + ' \n');
}



/**
 * "Undo" button functionality
 */

function ctrlZ() {
	var gcode = $('#gcode').html();
	if(gcode.lastIndexOf("(")>-1) {
	  gcode = gcode.substring(0, gcode.lastIndexOf("("));
	} 
	else {
	  alert("Can't undo");
	  return;
	}
	var hadThisLayerSteps = false;
	try {
    while (pattern.crossingPointsHistory[pattern.layer][ pattern.crossingPointsHistory[pattern.layer].length-1 ][1] == pattern.step) {
			pattern.crossingPointsHistory[pattern.layer].pop();
			hadThisLayerSteps = true;
		}
	}
	catch(err) {
	  alert("Can't undo");
	  return;
	}
	if (!hadThisLayerSteps) {//Step back to previous layer
		try {
	    while (pattern.crossingPointsHistory[pattern.layer-1][ pattern.crossingPointsHistory[pattern.layer-1].length-1 ][1] == pattern.step) {
				pattern.crossingPointsHistory[pattern.layer-1].pop();
				
			}
			pattern.layer--;
			pattern.layersBottomZs.pop();
		}
		catch(err) {
		  alert("Can't undo");
		  return;
		}
	}
	$('#gcode').html(gcode);
	if (hadThisLayerSteps) {
		document.getElementById('layerWeaves').removeChild(document.getElementById('pathshadow'+pattern.step));
		document.getElementById('layerWeaves').removeChild(document.getElementById('path'+pattern.step));
	}
	pattern.step--;
}
