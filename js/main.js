Math.TAU = Math.PI*2;

require('./d3.translate')
require('./d3.place')
require('./innersvg')

d3.selectAll("svg.fourth")
    .append("defs")
    .append("marker")
      .attr({id:'arrowhead', overflow:'visible', markerUnits:'userSpaceOnUse', orient:'auto'})
    .append("path")
      .attr("d", 'M 0 0 0 0 0 0 0 0')

var stage_linear = require('./stage_linear')()
var stage_vector_line = require('./stage_vector_line')()
var stage_scalar_field = require('./stage_scalar_field')()
var stage_vector_field = require('./stage_vector_field')()


stage_linear();
stage_vector_line();
stage_scalar_field();
stage_vector_field();
