Math.TAU = Math.PI*2;

require('./d3.translate')
require('./d3.place')

d3.selectAll("svg")
    .append("defs")
    .html('<marker id="arrowhead" overFlow="visible" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 0 0 0 0 0 0"></path></marker>')

var stage_linear = require('./stage_linear')()
var stage_vector_line = require('./stage_vector_line')()
var stage_scalar_field = require('./stage_scalar_field')()
var stage_vector_field = require('./stage_vector_field')()


stage_linear();
stage_vector_line();
stage_scalar_field();
stage_vector_field();
