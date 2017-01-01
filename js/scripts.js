var Pattern = function() {
	this.noOfWarpsX = 8;
	this.noOfWarpsY = 8;
	this.layerHeight = 20;
	this.warpSpacingX = 60;
	this.warpSpacingY = Math.sqrt(Math.pow(this.warpSpacingX,2) - Math.pow(this.warpSpacingX/2,2));
	this.pointsOffsets = [
		[	-1*this.warpSpacingX/4, -1*this.warpSpacingY/2],
		[	   this.warpSpacingX/4, -1*this.warpSpacingY/2],
		[		 this.warpSpacingX/2, 	0],
		[		 this.warpSpacingX/4,		this.warpSpacingY/2],
		[	-1*this.warpSpacingX/4, 	this.warpSpacingY/2],
		[	-1*this.warpSpacingX/2, 	0],
	];
	this.r = this.warpSpacingX/2;
	this.warps = [];
  this.crossingPoints = [];
  this.buttons = [];

  this.crossingPointsHistory = [];
  this.step = 0;
  this.layer = 0;
  this.zBottomHeight = 0;
  this.zTopHeight = 0;
  this.zCurrent = 0;
}

var pattern = new Pattern();
//TODO: separate spacing in CNC and in browser




/**
 * Warps
 */
var Warp = function(x, y, use) {
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

Warp.prototype.generatePoints = function() {
	//Generate crossing-points - these are the enter and exit points from a "button".
	for (var i=0; i<6; i++) {
		var px = this.x + pattern.pointsOffsets[i][0];
		var py = this.y + pattern.pointsOffsets[i][1];
		var pointExists = false;
		for (var j=0; j<pattern.crossingPoints.length; j++) {

			if(pattern.crossingPoints[j].x == px && pattern.crossingPoints[j].y == py) {
				pointExists = true;
				pattern.crossingPoints[j].ownerWarps.push(pattern.warps.indexOf(this));
				this.points.push(pattern.crossingPoints[j]);
			}
		}
		if (!pointExists) {
			var newPoint = new Point(px, py, this, pattern.crossingPoints.length);
			newPoint.draw();
			pattern.crossingPoints.push(newPoint);
			this.points.push(pattern.crossingPoints[pattern.crossingPoints.length-1]);
		}
	}
}

/**
 * Points are inbetween warps, weft thread passes through them.
 */
var Point = function(x, y, ownerWarp0) {
	this.x = x;
	this.y = y;
	this.ownerWarps = [];
	this.ownerWarps.push(pattern.warps.indexOf(ownerWarp0));
	this.div = undefined;
}
Point.prototype.draw = function() {
	var obj = this;
		var div = $('<a></a>')
		//TODO: separate spacing in CNC and in browser: calculate CSS positions
			.css('left', this.x+'px')
			.css('top', this.y+'px')
			.addClass('point')
			.on('click', function() {
				route(pattern.crossingPointsHistory[pattern.crossingPointsHistory.length-1], obj);
				pattern.crossingPointsHistory.push(obj);
			});
		$('#pattern').append(div);
		this.div = div;
}



$(function() {
	//Generate possible warps grid
	for (var i=0; i<pattern.noOfWarpsY; i++) {
		var rowOffsetX = 0;
		if (i%2!=0) {
			rowOffsetX = pattern.warpSpacingX/2;
		}
		for (var j=0; j<pattern.noOfWarpsX; j++) {
			var warpSlot = new Warp (
				pattern.warpSpacingX + pattern.warpSpacingX/2 + j * pattern.warpSpacingX + rowOffsetX,
				pattern.warpSpacingX + pattern.warpSpacingX/2 + i * pattern.warpSpacingY,
				false
			);
			warpSlot.draw();
			pattern.warps.push(warpSlot);
		}
	}

	var canvasWidth = (2*pattern.warpSpacingX + pattern.warpSpacingX/2 + j * pattern.warpSpacingX + rowOffsetX) +'px';
	var canvasHeight = (2*pattern.warpSpacingX + pattern.warpSpacingX/2 + i * pattern.warpSpacingY) +'px';
	$("#pattern")
		.css('width', canvasWidth)
		.css('height', canvasHeight);
	$("#layerWeaves")
		.css('width', canvasWidth)
		.css('height', canvasHeight);



	//"Warps done" button
	$('#endWarping').on('click', function() {
		$('#pattern').removeClass('prewarping');
		for(var i=0; i<pattern.warps.length; i++) {
			pattern.warps[i].div.off('click');
			if (!pattern.warps[i].use) {
				pattern.warps[i].div.hide();
			}
			else {
				pattern.warps[i].generatePoints();
			}
		}
		pattern.crossingPointsHistory.push(pattern.crossingPoints[0]);

		pattern.crossingPoints[0].div.addClass('start');

		$('#undo').show().on('click', ctrlZ);
		$('#prewarping-instruction').hide();
		$('#weaving-instruction').show();
		$(this).hide();
	});






});

function route(point1, point2) {
	pattern.step++;
	var commonWarp = undefined;
	for (var i=0; i<point1.ownerWarps.length; i++) {
		for (var j=0; j<point2.ownerWarps.length; j++) {
			if (point1.ownerWarps[i] == point2.ownerWarps[j]) {
				commonWarp = point1.ownerWarps[i];
				break;
			}
		}
	}
	if (commonWarp != undefined) {
		$('#gcode').html($('#gcode').html() + gcodeZ('arc', point1, point2));
		$('#gcode').html($('#gcode').html() + gcodeArc(point1, point2, commonWarp));
		drawSvgArc(point1, point2, commonWarp);
	}
	else {
		$('#gcode').html($('#gcode').html() + gcodeZ('line', point1, point2));
		$('#gcode').html($('#gcode').html() + gcodeLine(point1, point2));
		drawSvgLine(point1, point2);
	}
}

function gcodeZ(type, point1, point2) {
	//TODO line-type specific stuff
	var subLayersInPoint = 0;
	for (var i=0; i<pattern.crossingPointsHistory.length; i++) {
		if (pattern.crossingPointsHistory[i].x == point2.x && pattern.crossingPointsHistory[i].y == point2.y) {
			subLayersInPoint++;
		}
	}
	pattern.zCurrent = pattern.zBottomHeight + subLayersInPoint*pattern.layerHeight;
	return ';'+pattern.step+' \nG00 X' +  point1.x + ' Y' + point1.y + ' Z'+pattern.zCurrent+' \n';
}

function gcodeLine(point1, point2) {
	return 'G00 X' +  point2.x + ' Y' + point2.y + ' Z'+pattern.zCurrent+' \n';
	//G00 X#.#### Y#.#### Z#.#### //maximum feed rate
	//G01 X#.#### Y#.#### Z.#.#### F#.####
}

function gcodeArc(point1, point2, commonWarpIndex) {
	var direction = arcDirection(point1, point2, commonWarpIndex);
	console.log('G-code arc direction: '+ direction);
	var result = 'G';
	if (direction=='cw') {
		result += '03 ';//cw direction of canvas coordinates is ccw direction in the mirrored cnc coordinates
	}
	else {
		result += '02 ';//ccw direction of canvas coordinates is cw direction in the mirrored cnc coordinates
	}
	result += ('X' + point2.x + ' '); 
	result += ('Y' + point2.y + ' ');
	result += ('I' + (pattern.warps[commonWarpIndex].x - point1.x) + ' ');
	result += ('J' + (pattern.warps[commonWarpIndex].y - point1.y) + ' \n');
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
 	  'id': 'pathshadow'+pattern.step
 	});
 	document.getElementById('layerWeaves').appendChild(line);
  line = makeSVG('line', {
  	x1: point1.x, 
  	y1: point1.y, 
  	x2: point2.x, 
  	y2: point2.y,
    stroke: '#ff3300', 
    'stroke-width': 2,
    'id': 'path'+pattern.step
  });
  document.getElementById('layerWeaves').appendChild(line);
}

function drawSvgArc(point1, point2, commonWarpIndex) {
	var direction = arcDirection(point1, point2, commonWarpIndex);
	console.log('SVG arc direction: '+ direction);
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
   'id': 'pathshadow'+pattern.step
  });
  document.getElementById('layerWeaves').appendChild(arc);
  //Second path is colored line
  path = 'M '+point1.x+' '+point1.y+' A '+pattern.r+' '+pattern.r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  arc = makeSVG('path', {d: path,
    'stroke': '#ff3300', 
    'stroke-width': 2, 
    'fill': 'transparent',
    'id': 'path'+pattern.step
  });
  document.getElementById('layerWeaves').appendChild(arc);
}


function makeSVG(tag, attrs) { //http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)  
    el.setAttribute(k, attrs[k]);
  return el;
}

function arcDirection(point1, point2, commonWarpIndex) {
	for (var i=0; i<6; i++) {
		var point1index, point2index;
		if (pattern.warps[commonWarpIndex].points[i] == point1) {
			point1index = i;
		}
		else if (pattern.warps[commonWarpIndex].points[i] == point2) {
			point2index = i;
		}
	}
	if (point1index-point2index > 0) {
		if (point1index-point2index <= 2) {
			return 'ccw';
		}
		else {
			return 'cw';
		}
	}
	else {
		if(point1index-point2index >= -2) {
			return 'cw';
		}
		else {
			return 'ccw';
		}
	}
}

function ctrlZ() {
	var gcode = $('#gcode').html();
	if(gcode.lastIndexOf("\n")>-1) {
	  gcode = gcode.substring(0, gcode.lastIndexOf(";"));
	} 
	else {
	  alert("Can't undo");
	  return;
	}
	$('#gcode').html(gcode);
	document.getElementById('layerWeaves').removeChild(document.getElementById('pathshadow'+pattern.step));
	document.getElementById('layerWeaves').removeChild(document.getElementById('path'+pattern.step));
	pattern.step--;
	pattern.crossingPointsHistory.pop();
}
