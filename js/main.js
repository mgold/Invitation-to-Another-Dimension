Math.TAU = Math.PI*2;

require('./d3.translate')
require('./d3.place')
require('./innersvg')

require('./headings')

window.onload = function(){
    var stage_linear = require('./stage_linear')()
    var stage_vector_line = require('./stage_vector_line')()
    var stage_scalar_field = require('./stage_scalar_field')()
    var stage_vector_field = require('./stage_vector_field')()
    var stage_vector_field3 = require('./stage_vector_field3')()

    var stage = function(sel, f){
        var bb = document.querySelector(sel).getBoundingClientRect();
        var trigger = bb.top + bb.height * 0.8;
        d3.timer(function(){
            if (window.scrollY + window.innerHeight > trigger){
                f();
                return true; // stop timer to avoid reanimating
            }
        })
    }

    stage("svg.first", stage_linear);
    stage("svg.second", stage_vector_line);
    stage("svg.third", stage_scalar_field);
    stage("svg.fourth", stage_vector_field);
    stage("svg.fifth", stage_vector_field3);
}
