
$(function() {

  /*Buttons event handlers*/
  $(document).on('change', 'input[name=layer-to-highlight]', highlightALayerStart);
  $('#layer-duplicate').on('click', duplicateLayer);

});


function highlightALayerStart() {
  var val = $('input[name=layer-to-highlight]:checked').val();
  $('.hilight-layerstart').removeClass('hilight-layerstart');
  if (val != '') {
    pattern.steps[parseInt(val)][0].EndPoint.div.addClass('hilight-layerstart').attr('data-start-layer', val);
  }
}

function duplicateLayer() {
  var val = $('input[name=layer-to-highlight]:checked').val();
  if (val && pattern.steps[val][0].EndPoint == lastElementOf(lastElementOf(pattern.steps)).EndPoint) {
    val = parseInt(val);

    for (var i=0; i<pattern.steps[val].length; i++) {
      if (i==0) {
        //If last layer has steps in it then create a new layer for repetition.
        //If user just created an empty new layer then duplicate on that one.
        if(lastElementOf(pattern.steps).length > 1) {
          newLayer();
        }
      }
      else {
        route(
            lastElementOf(lastElementOf(pattern.steps)).EndPoint,
            pattern.steps[val][i].EndPoint
        );
      }
    }
  }
  else {
    alert("To repeat a layer:\n- a layer must be finished (new layer added after it)\n- select a layer number\n- then it's start point is shown in blue\n- move the thread to that point\n- then click 'Repeat layer'");
  }
}
