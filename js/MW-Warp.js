
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

Warp.prototype.generatePoints = function(pattern) {
  //Generate crossing-points - these are the enter and exit points from a "button".
  var pointsOffsets = pattern.pointsOffsets(pattern.warpSpacingX, pattern.warpSpacingY);
  for (var i=0; i<6; i++) {
    var x = this.x + pointsOffsets[i][0];
    var y = this.y + pointsOffsets[i][1];
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