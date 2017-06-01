

/**
 * Points are in between warps, weft thread passes through them.
 */
var Point = function(x, y, ownerWarp0) {
  this.x = x;
  this.y = y;
  this.sublayers = [0]; //Array element for each actual layer.
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
