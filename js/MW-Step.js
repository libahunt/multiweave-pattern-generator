/**
 * Step objects are stored in pattern.steps array where a sub array exists for each layer.
 * A pattern.steps subarray (layer) starts with a Step that has only endPoint and sublayer (=0) defined.
 */
var Step = function(StartPoint, EndPoint, lineType, arcDir, Warp, sublayer, startOfUserCommand) {
  this.StartPoint = StartPoint; //Refers to point object
  this.EndPoint = EndPoint;  //Refers to point object
  this.lineType = lineType; //'arc' or 'line'
  this.arcDir = arcDir; //'cw' or 'ccw'
  this.Warp = Warp; //Refers to warp object that is the center of the arc
  this.sublayer = sublayer; //sublayer number
  this.startOfUserCommand = startOfUserCommand; //Helper for "undo" to work properly
};
