Math.TAU = Math.PI*2;

require('./d3.translate')
require('./d3.place')

var stage_linear = require('./stage_linear')()
var stage_vector_line = require('./stage_vector_line')()
var stage_scalar_field = require('./stage_scalar_field')()
var stage_vector_field = require('./stage_vector_field')()

stage_linear();
stage_vector_line();
stage_scalar_field();
stage_vector_field();
