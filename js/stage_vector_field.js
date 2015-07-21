var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = 2,   m12 = -0.5, m13 = 1.5,
        m21 = 0.5, m22 = 3,    m23 = -1.8;
    var point = true;

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

    var f = function(x1,x2){
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
        .domain([-5, 5])
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
        symbols(symbolsParent, 1);
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

    var symbols = function(g, order){

        g.append("g")
            .selectAll("g")
            .data([[m11], [m21, "mOffDiag"], [0, "inactive"],
                   [m12, "mOffDiag"], [m22], [0, "inactive"],
                   [m13, "b"], [m23, "b"], [1, "inactive"]])
            .call(utils.matrix)

        g.append("g")
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

        return

        g.place("rect.m11")
            .translate(30, 59)
            .text(y)
            .style("font-weight", 600)
            .style("text-anchor", "end")

        g.place("text.eq")
            .translate(40, 64)
            .text("=")

        g.place("g.m").translate(74, 0)
            .selectAll("g")
            .data([[m1.toFixed(2)], [m2.toFixed(2)]])
            .call(utils.vec)
            .each(function(d,i){
                i ? makeDraggerM2(d3.select(this)) : makeDraggerM1(d3.select(this))
            })

        g.place("text.dot")
            .translate(133, 64)
            .text("•")

        var x1 = curX ? curX.x1 : "x"+utils.sub1
        var x2 = curX ? curX.x2 : "x"+utils.sub2
        g.place("g.x").translate(160, 0)
            .selectAll("g")
            .data([[x1, "x1"], [x2, "x2"]])
            .call(utils.vec)

        g.place("text.plus")
            .translate(230, 63)
            .text("+")

        g.place("text.b")
            .translate(270, 58)
            .text(b.toFixed(2))
            .style("font-weight", 600)
            .call(makeDraggerB)

    }

    return function(){render(true);}
}
