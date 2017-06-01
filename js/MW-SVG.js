

function drawSvgLine(point1, point2) {
  var line = makeSVG('line', {
    x1: point1.x,
    y1: point1.y,
    x2: point2.x,
    y2: point2.y,
    'stroke': 'rgba(255,255,255,0.85)',
    'stroke-width': 8,
    'id': 'pathshadow'+pattern.userMoveNo,
    'class': 'layer'+pattern.currentLayer
  });
  document.getElementById('layerWeaves').appendChild(line);
  line = makeSVG('line', {
    x1: point1.x,
    y1: point1.y,
    x2: point2.x,
    y2: point2.y,
    stroke: '#ff3300',
    'stroke-width': 2,
    'id': 'path'+pattern.userMoveNo,
    'class': 'layer'+pattern.currentLayer
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
    'id': 'pathshadow'+pattern.userMoveNo,
    'class': 'layer'+pattern.currentLayer
  });
  document.getElementById('layerWeaves').appendChild(arc);
  //Second path is colored line
  path = 'M '+point1.x+' '+point1.y+' A '+pattern.r+' '+pattern.r+' 0 0'+ flag+' '+point2.x+' '+point2.y;
  arc = makeSVG('path', {d: path,
    'stroke': '#ff3300',
    'stroke-width': 2,
    'fill': 'transparent',
    'id': 'path'+pattern.userMoveNo,
    'class': 'layer'+pattern.currentLayer
  });
  document.getElementById('layerWeaves').appendChild(arc);
}

function makeSVG(tag, attrs) { //http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)
    el.setAttribute(k, attrs[k]);
  return el;
}