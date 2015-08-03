var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 2, m2 = -4, b = 0.5;
    var curX = null;

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var f = function(d){return m1*d.x1 + m2*d.x2 + b}

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()){callback(); render();}}))
        }
    }
    var makeDraggerM1 = makeDragger(function(){m1 += d3.event.dx/10});
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/10});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10});

    var x = d3.scale.linear()
        .domain([-3, 3])
        .range([-200, 200])

    var r = d3.scale.sqrt()
        .domain([0, 60])
        .range([1, x(1) - x(0.5)])

    // DOM element selections
    var svg = d3.select("svg.third").attr("id", "scalar-field")
    var symbols1Parent = svg.append("g")
        .translate(160, 250)
    var symbols2Parent = svg.append("g")
        .translate(850, 200)
    var plot = svg.append("g")
        .translate(600, 250)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")
    var storySliderParent = d3.select("span.third");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 3*transDur);
        }
        m1 = utils.clamp(-10, 10, m1)
        m2 = utils.clamp(-10, 10, m2)
        b = utils.clamp(-10, 10, b)
        storySlider(storySliderParent);
        axes(layer1, 0, initialRender)
        circlesY(layer2, 1);
        symbols1(symbols1Parent, 2);
        symbols2(symbols2Parent, 2.5, initialRender);
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

    var storySlider = function(g){
        g.text(b.toFixed(1)).call(makeDraggerB)
    }

    var symbols1 = function(g, order){
        var symbols = g.selectAll("text")
            .data(["<tspan class='y1'>y</tspan> = m"+utils.sub1+"<tspan class='x1'>x"+utils.sub1+"</tspan> + m"+utils.sub2+"<tspan class='x2'>x"+utils.sub2+"</tspan> + b",
                   "<tspan class='y1'>y</tspan> = <tspan class='dragM1'>"+m1.toFixed(1)+"</tspan><tspan class='x1'>x"+utils.sub1+"</tspan> <tspan class='dragM2'>"+utils.b(m2, 1)+"</tspan><tspan class='x2'>x"+utils.sub2+"</tspan> <tspan class='dragB'>" + utils.b(b, 1) + "</tspan>",
                   !curX ? "" : "<tspan class='y1'>"+f(curX).toFixed(1)+"</tspan> = "+m1.toFixed(1)+"×<tspan class='x1'>"+curX.x1+"</tspan> "+utils.b(m2, 1)+"×<tspan class='x2'>"+curX.x2+"</tspan> " + utils.b(b, 1)
                   ])
        symbols.enter().append("text")
            .style("opacity", 0)
            .translate(function(d,i){return [0, [-20, 10, 40, 70][i]]})
          .transition().duration(transDur/2).delay(transDur*order)
            .style("opacity", 1)
        symbols.html(function(d){return d})

        symbols.selectAll(".dragM1")
            .call(makeDraggerM1)
        symbols.selectAll(".dragM2")
            .call(makeDraggerM2)
        symbols.selectAll(".dragB")
            .call(makeDraggerB)
    }

    var symbols2 = function(g, order, initialRender){
        if (initialRender){
            g.attr("opacity", 0)
                .transition().duration(transDur/2).delay(transDur*order)
                .attr("opacity", 1)
        }

        var y = curX ? f(curX).toFixed(1) : "y"
        g.place("text.y1")
            .translate(30, 59)
            .text(y)
            .style("font-weight", 600)
            .style("text-anchor", "end")

        g.place("text.eq")
            .translate(40, 64)
            .text("=")

        g.place("g.m").translate(74, 0)
            .selectAll("g")
            .data([[m1.toFixed(1)], [m2.toFixed(1)]])
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
            .translate(220, 63)
            .text(b < -0.01 ? "–" : "+")
            // make the minus line up with the plus - probably very font dependent
            .attr("dy", b < -0.01 ? "-2px" : null)
            .attr("dx", b < -0.01 ? "2.7px" : null)

        g.place("text.b")
            .translate(245, 58)
            .text(Math.abs(b).toFixed(1))
            .style("font-weight", 600)
            .call(makeDraggerB)

    }

    var circlesY = function(g, order){
        var data = utils.cross(d3.range(-3,4), d3.range(-3,4))
        var circles = g.selectAll("circle").data(data)
        circles.attr("r", function(d){return r(Math.abs(f(d)))})
            .classed("negative", function(d){return f(d) < 0})
        circles.exit().transition().attr("r", 0).remove();
        circles.enter().append("circle")
            .attr("class", "y1")
            .attr("cx", function(d){return x(d.x1)})
            .attr("cy", function(d){return x(d.x2)})
            .attr("r", 0)
            .classed("negative", function(d){return f(d) < 0})
            .on("mouseenter", function(d){ if (!curX){ curX = d; d3.select(this).classed("current", true); render()}})
            .on("mouseout", function(d){
                var sel = d3.select(this);
                if (sel.classed("current")){
                    curX = null; sel.classed("current", null); render()}
                })
          .transition().duration(transDur).delay(transDur*order)
            .attr("r", function(d){return r(Math.abs(f(d)))})
    }

    return function(){render(true);}
}
