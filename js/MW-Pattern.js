var Pattern = function(noOfWarpsX, noOfWarpsY) {
  //Pattern size as number of warps in a row and number of zig-zag shifted rows
  this.noOfWarpsX = noOfWarpsX;
  this.noOfWarpsY = noOfWarpsY;

  //Measurements on browser canvas, px
  this.warpSpacingX = 60;
  this.warpSpacingY = Math.sqrt(Math.pow(this.warpSpacingX,2) - Math.pow(this.warpSpacingX/2,2));
  this.r = this.warpSpacingX / 2; //Radius for drawing arcs.
  this.canvasEdge = this.warpSpacingX; //Just some aesthetic spacing on the screen.
  this.canvasWidth = (this.noOfWarpsX-0.5) * this.warpSpacingX + 2*this.canvasEdge;
  this.canvasHeight = (this.noOfWarpsY-1) * this.warpSpacingY + 2*this.canvasEdge;


  //Array of possible and actual warp positions objects
  this.warps = [];
  //Array of crossing points e.g "buttons" on the path. Will get generated around the warps that are in use.
  this.crossingPoints = [];

  //Helper to calculate crossingpoint's coordinates from warp coordinates.
  this.pointsOffsets = function(spacingX, spacingY) {
    return [
      [	-1*spacingX/4, -1*spacingY/2],
      [	   spacingX/4, -1*spacingY/2],
      [		 spacingX/2, 	0],
      [		 spacingX/4,	spacingY/2],
      [	-1*spacingX/4, 	spacingY/2],
      [	-1*spacingX/2, 	0],
    ];
  };

  //Array to save all Step objects by layer. This is where the actual pattern takes place.
  this.steps = [];
  this.userMoveNo = 0; //Counter keeps track of html elements to be deleted when undo function is used.

  this.currentLayer = 0;
  //Array to save how many sub layers exist in each user defined layer. Calculated on generating next main layer.
  this.sublayers = [];
  this.sublayersTotal = 0;


};



//TODO save and reload
Pattern.prototype.createJSON = function() {

};

Pattern.prototype.loadFromJSON = function() {

};

Pattern.prototype.drawNew = function() {
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
          pattern.canvasEdge + j*pattern.warpSpacingX + rowOffsetX,
          pattern.canvasEdge  + i*pattern.warpSpacingY,
          false
      );
      warp.draw();
      pattern.warps.push(warp);
    }
  }
};

Pattern.prototype.drawExisting = function() {

  //TODO: if loading existing pattern in warping state, read the ".use" values
  //TODO: if loading existing pattern in wefting state, only create warps that are in use

};



