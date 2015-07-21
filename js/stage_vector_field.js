var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = 2,   m12 = -0.5, m13 = 1.5,
        m21 = 0.5, m22 = 3,    m23 = -1.8;
    var point = true;
    var curPos = null;

    var transDur = 1000;

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()){callback(); render();}}))
        }
    }
    var makeDraggerM1 = makeDragger(function(){m1 += d3.event.dx/20});
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/20});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10});

    var f = function(a){
        var x1 = a[0], x2 = a[1]
        if (point){
            return [x1 * m11 + x2 * m12 + m13,
                    x1 * m21 + x2 + m22 + m23,
                    1]
        }else{
            return [x1 * m11 + x2 * m12,
                    x1 * m21 + x2 + m22,
                    0]
        }
    }

    var x = d3.scale.linear()
        .domain([-3, 3])
        .range([-150, 150])

    var r = d3.scale.sqrt()
        .domain([0, 60])
        .range([1, x(1) - x(0.5)])

    // DOM element selections
    var svg = d3.select("svg.fourth")
    var symbolsParent = svg.append("g")
        .translate(850, 200)
    var plot = svg.append("g")
        .translate(600, 250)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 3*transDur);
        }
        //m1 = utils.clamp(-10, 10, m1)
        axes(layer1, 0, initialRender)
        circlesY(layer2, 1)
        symbols(symbolsParent, 2);
    }

    var axes = function(g, order, initialRender){
        if (initialRender){
            g.append("line")
                .attr("class", "x1")
                .style("stroke-width", "2px")
                .attr({x1: 0, x2: 0, y1: 0, y2: 0})
                .transition().duration(transDur).delay(transDur*order)
                .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
            g.append("line")
                .attr("class", "x2")
                .style("stroke-width", "2px")
                .attr({x1: 0, x2: 0, y1: 0, y2: 0})
                .transition().duration(transDur).delay(transDur*order)
                .attr({x1: 0, x2: 0, y1: x.range()[0], y2: x.range()[1]})
        }
    }

    var circlesY = function(g, order){
        var r = x(1);
        var bases = g.selectAll("g.base")
            .data(d3.range(0, Math.TAU-0.01, Math.TAU/12)
                    .map(function(d){var a = [r*Math.cos(d), r*Math.sin(d)]; a.theta = d; return a;}));
        bases.select("line") // update selection only
            .attr("x2", function(d){return f(d)[0]})
            .attr("y2", function(d){return f(d)[1]})
        var entering = bases.enter().append("g").attr("class", "base")
            .translate(function(d){return d})
        entering.append("circle").attr("r", 0)
          .transition().delay(transDur*order).duration(transDur)
            .attr("r", 4)
        entering.append("line").attr({x1: 0, y1: 0, x2: 0, y2:0})
          .transition().delay(transDur*(order+1)).duration(transDur)
            .attr("x2", function(d){return f(d)[0]})
            .attr("y2", function(d){return f(d)[1]})

        bases.on("mouseenter", function(d){
            if (!utils.isFrozen() && curPos === null){
                d3.select(this).classed("current", true)
                curPos = d;
            }
        }).on("mouseout", function(d){
            if (!utils.isFrozen() && curPos === d){
                d3.select(this).classed("current", false)
                curPos = null;
            }
        })

        bases.exit().remove();
    }

    var symbols = function(g, order){
        g.place("g.matrix")
            .selectAll("g")
            .data([[m11], [m21, "mOffDiag"], [0, "inactive"],
                   [m12, "mOffDiag"], [m22], [0, "inactive"],
                   [m13, "b"], [m23, "b"], [1, "inactive"]])
            .call(utils.matrix)

        g.place("g.vector3")
            .translate(180, 0)
            .selectAll("g")
            .data([[3, "x1"], [-2, "x2"], [point ? 1 : 0, point ? "point" : "vector"]])
            .call(utils.vec)

        g.select(".point, .vector")
         .on("click", function(){
             if (!utils.isFrozen()){
                 point = !point;
                 render();
             }
         })

    }

    return function(){render(true);}
}
