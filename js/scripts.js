var noOfWeftsX = 8;
var noOfWeftsY = 8;
var layerHeight = 20;
var weftSpacingX = 60;
var weftSpacingY = Math.sqrt(Math.pow(weftSpacingX,2) - Math.pow(weftSpacingX/2,2));
var pointsOffsets = [
	[	-1*weftSpacingX/4, -1*weftSpacingY/2],
	[	   weftSpacingX/4, -1*weftSpacingY/2],
	[		 weftSpacingX/2, 	0],
	[		 weftSpacingX/4,		weftSpacingY/2],
	[	-1*weftSpacingX/4, 		weftSpacingY/2],
	[	-1*weftSpacingX/2, 	0],
];
var r = weftSpacingX/2;


var wefts = [];
var crossingPoints = [];
var buttons = [];

var crossingPointsHistory = [];
var step = 0;
var layer = 0;
var zBottomHeight = 0;
var zTopHeight = 0;
var zCurrent = 0;

$(function() {

	function Point(x, y, ownerWeft0) {
		this.x = x;
		this.y = y;
		this.ownerWefts = [];
		this.ownerWefts.push(wefts.indexOf(ownerWeft0));
		this.draw = function() {
			var obj = this;
			var div = $('<div></div>')
				.css('left', this.x+'px')
				.css('top', this.y+'px')
				.addClass('point')
				.on('click', function() {
					route(crossingPointsHistory[crossingPointsHistory.length-1], obj);
					crossingPointsHistory.push(obj);
				});
			$('#pattern').append(div);
		}
	}

	function Weft(x, y, use) {
	  this.x = x;
	  this.y = y;
	  this.use = use;
	  this.div = undefined;
	  this.draw = function() {
	  	var obj = this;
	    var div = $('<div></div>')
		    .css('left', x+'px')
		    .css('top', y+'px')
		    .addClass('weft')
		    .on('click', function() {
		    	obj.toggleUse();
		    });
	    if (use) {
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
	  this.toggleUse = function() {
	  	this.use = !this.use;
	  	if (this.use) {
	  		this.div.addClass('use');
	  	}
	  	else {
	  		this.div.removeClass('use');
	  	}
	  }
	  this.hide = function() {
	  	this.div.addClass('hidden');
	  }
	  this.points = [];
	  this.generatePoints = function() {
	  	//Generate crossing-points - these are the enter and exit points from a "button".
	  	for (var i=0; i<6; i++) {
	  		var px = this.x + pointsOffsets[i][0];
	  		var py = this.y + pointsOffsets[i][1];
	  		var pointExists = false;
	  		for (var j=0; j<crossingPoints.length; j++) {

	  			if(crossingPoints[j].x == px && crossingPoints[j].y == py) {
	  				pointExists = true;
	  				crossingPoints[j].ownerWefts.push(wefts.indexOf(this));
	  				this.points.push(crossingPoints[j]);
	  			}
	  		}
				if (!pointExists) {
					var newPoint = new Point(px, py, this, crossingPoints.length);
					newPoint.draw();
					crossingPoints.push(newPoint);
					this.points.push(crossingPoints[crossingPoints.length-1]);
				}
	  	}
			
	  }

	}

	//Generate possible wefts grid
	for (var i=0; i<noOfWeftsY; i++) {
		var rowOffsetX = 0;
		if (i%2!=0) {
			rowOffsetX = weftSpacingX/2;
		}
		for (var j=0; j<noOfWeftsX; j++) {
			var weftSlot = new Weft (
				weftSpacingX/2 + j * weftSpacingX + rowOffsetX,
				weftSpacingX/2 + i * weftSpacingY,
				false
			);
			weftSlot.draw();
			wefts.push(weftSlot);
		}
	}


	//Generate buttons.
		//TODO


	//"Wefts done" button
	$('#endWefting').on('click', function() {
		$('#pattern').removeClass('prewefting');
		for(var i=0; i<wefts.length; i++) {
			wefts[i].div.off('click');
			if (!wefts[i].use) {
				wefts[i].div.hide();
			}
			else {
				wefts[i].generatePoints();
			}
		}
		crossingPointsHistory.push(crossingPoints[0]);

		$('#undo').show().on('click', ctrlZ);
		$(this).hide();
	});






});

function route(point1, point2) {
	step++;
	var commonWeft = undefined;
	for (var i=0; i<point1.ownerWefts.length; i++) {
		for (var j=0; j<point2.ownerWefts.length; j++) {
			if (point1.ownerWefts[i] == point2.ownerWefts[j]) {
				commonWeft = point1.ownerWefts[i];
				break;
			}
		}
	}
	if (commonWeft != undefined) {
		$('#gcode').html($('#gcode').html() + gcodeZ('arc', point1, point2));
		$('#gcode').html($('#gcode').html() + gcodeArc(point1, point2, commonWeft));
		drawSvgArc(point1, point2, commonWeft);
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
	for (var i=0; i<crossingPointsHistory.length; i++) {
		if (crossingPointsHistory[i].x == point2.x && crossingPointsHistory[i].y == point2.y) {
			subLayersInPoint++;
		}
	}
	zCurrent = zBottomHeight + subLayersInPoint*layerHeight;
	return ';'+step+' \nG00 X' +  point1.x + ' Y' + point1.y + ' Z'+zCurrent+' \n';
}

function gcodeLine(point1, point2) {
	return 'G00 X' +  point2.x + ' Y' + point2.y + ' Z'+zCurrent+' \n';
	//G00 X#.#### Y#.#### Z#.#### //maximum feed rate
	//G01 X#.#### Y#.#### Z.#.#### F#.####
}

function gcodeArc(point1, point2, commonWeftIndex) {
	var direction = arcDirection(point1, point2, commonWeftIndex);
	var result = 'G';
	if (direction=='cw') {
		result += '02 ';
	}
	else {
		result += '03 ';
	}
	result += ('X' + point2.x + ' '); 
	result += ('Y' + point2.y + ' ');
	result += ('I' + (wefts[commonWeftIndex].x - point1.x) + ' ');
	result += ('J' + (wefts[commonWeftIndex].y - point1.y) + ' \n');
	//result += 'F#';//F feed rate ... (inch/min)
	return result;
}

function drawSvgLine(point1, point2) {
  var line = makeSVG('line', {x1: point1.x, y1: point1.y, x2: point2.x, y2: point2.y,
   stroke: '#ff3300', 'stroke-width': 2});
  document.getElementById('layerWeaves').appendChild(line);
}

function drawSvgArc(point1, point2, commonWeft) {
	var direction = arcDirection(point1, point2, commonWeft);
	var flag = 0;
	if (direction == 'cw') {
		flag = 1;
	}
	//First path is a "shadow"
	var path = 'M '+point1.x+' '+point1.y+' A '+r+' '+r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  var arc = makeSVG('path', {d: path,
   'stroke': 'rgba(255,255,255,0.85)', 
   'stroke-width': 8, 
   'fill': 'transparent',
   'id': 'pathshadow'+step
 });
  document.getElementById('layerWeaves').appendChild(arc);
  //Second path is colored line
  path = 'M '+point1.x+' '+point1.y+' A '+r+' '+r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  arc = makeSVG('path', {d: path,
    'stroke': '#ff3300', 
    'stroke-width': 2, 
    'fill': 'transparent',
    'id': 'path'+step
  });
  document.getElementById('layerWeaves').appendChild(arc);
}


function makeSVG(tag, attrs) { //http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)  
    el.setAttribute(k, attrs[k]);
  return el;
}

function arcDirection(point1, point2, commonWeftIndex) {
	for (var i=0; i<6; i++) {
		var point1index, point2index;
		if (wefts[commonWeftIndex].points[i] == point1) {
			point1index = i;
		}
		else if (wefts[commonWeftIndex].points[i] == point2) {
			point2index = i;
		}
	}
	if (point1index==5 && point2index==0) {
		return 'cw';
	}
	else if (point1index==0 && point2index==5) {
		return 'ccw';
	}
	else if (point1index<point2index) {
		return 'cw';
	}
	else {
		return 'ccw';
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
	document.getElementById('layerWeaves').removeChild(document.getElementById('pathshadow'+step));
	document.getElementById('layerWeaves').removeChild(document.getElementById('path'+step));
	step--;
	crossingPointsHistory.pop();
}
