

/**
 * Points are in between warps, weft thread passes through them.
 */
var Point = function(x, y, ownerWarp0) {
  this.x = x;
  this.y = y;
  this.sublayers = [[]]; //1. Array for each actual layer.
  // 2. Elements (missing yet) will be arrays that consist of two "levels" for each step that passed this point
  // and the 2 levels are "on entry" and "on exit" - so it's possible to keep track of history and undo it.
  this.ownerWarps = [ownerWarp0];
  this.div = undefined;
};

Point.prototype.draw = function() {
  var obj = this;
  var div = $('<a></a>')
      .css('left', this.x+'px')
      .css('top', this.y+'px')
      .addClass('point')
      .on('click', function() {
        if (pattern.userMoveNo == 0) {
          $(this).addClass('start');
          pattern.steps.push([new Step(null, obj, null, null, null, 0, true)]);
          pattern.userMoveNo = 1;
          obj.sublayers[0].push([0, null]);
        }
        else {
          route(
              lastElementOf(lastElementOf(pattern.steps)).EndPoint,
              obj
          );
        }
      });
  $('#pattern').append(div);
  this.div = div;
};
