var utils = require('./utils');
module.exports = function(){

    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 0.4, b1 = 0;
    var m2 = 1.4, b2 = 0;
    var hoverX = null;

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var f1 = function(x){return m1*x + b1}
    var f2 = function(x){return m2*x + b2}
    var f = [f1, f2]

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()){callback(); render();}}))
        }
    }
    var makeDraggerM1 = makeDragger(function(){m1 += d3.event.dx/10});
    var makeDraggerB1 = makeDragger(function(){b1 += d3.event.dx/10});
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/10});
    var makeDraggerB2 = makeDragger(function(){b2 += d3.event.dx/10});

    var x = d3.scale.linear()
            .domain([-7, 7])
            .range([-300, 300])
    var circleSamples = d3.range(-5, 6);
    var axisSpacing = 50;
    var isZero = function(x){ return x > -0.001 && x < 0.001 }

    var centerX = window.innerWidth/2;
    // DOM element selections
    var svg = d3.select("svg.second")
    var symbols1Parent = svg.append("g")
        .translate(centerX, 50)
    var symbols2Parent = svg.append("g")
        .translate(centerX-108, 105)
    var plot = svg.append("g")
        .translate(centerX, 300)
    var layer0 = plot.append("g");
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 7*transDur);
        }

        m1 = utils.clamp(-4, 4, m1)
        m2 = utils.clamp(-4, 4, m2)
        b1 = utils.clamp(-4, 4, b1)
        b2 = utils.clamp(-4, 4, b2)

        axis(     layer0, 0, initialRender);
        circlesX( layer2, 0, initialRender);

        linesY1(  layer1, 1, initialRender);
        circlesY1(layer1, 1, initialRender);
        lineY1(   layer1, 2, initialRender);

        linesY2(  layer1, 4, initialRender);
        circlesY2(layer1, 4, initialRender);
        lineY2(   layer1, 5, initialRender);

        symbols1(symbols1Parent, 6);
        symbols2(symbols2Parent, 6.5, initialRender);
    }

    var axis = function(g, order, initialRender){
        if (initialRender){
            var zero = x(0);
            g.append("line")
                .attr("class", "x1")
                .attr({x1: zero, x2: zero, y1: 0, y2: 0})
              .transition().duration(transDur).delay(transDur*order)
                .attr({x1: x.range()[0], x2: x.range()[1]})
            g.append("line")
                .attr({x1: zero, x2: zero, y1: 0, y2: 0})
              .transition().duration(transDur).delay(transDur*order)
                .attr({y1: 10, y2: -10})
        }
    }

    var symbols1 = function(g, order){
       var symbols = g.selectAll("text")
           .data([ utils.y1+" = <tspan class='dragM1'>"+utils.fmtU(m1)+"</tspan>"+utils.x+" <tspan class='dragB1'>"+utils.fmtB(b1)+"</tspan>",
                   hoverX === null ? "" : "<tspan class='y1'>"+utils.fmtU(f1(hoverX))+"</tspan> = <tspan class='dragM1'>"+utils.fmtU(m1)+"</tspan>×<tspan class='x1'>"+utils.fmtU(hoverX, 0)+"</tspan> <tspan class='dragB1'>"+utils.fmtB(b1)+"</tspan>",
                   utils.y2+" = <tspan class='dragM2'>"+utils.fmtU(m2)+"</tspan>"+utils.x+" <tspan class='dragB2'>"+utils.fmtB(b2)+"</tspan>",
                   hoverX === null ? "" : "<tspan class='y2'>"+utils.fmtU(f2(hoverX))+"</tspan> = <tspan class='dragM2'>"+utils.fmtU(m2)+"</tspan>×<tspan class='x1'>"+utils.fmtU(hoverX, 0)+"</tspan> <tspan class='dragB2'>"+utils.fmtB(b2)+"</tspan>"
                 ])
        symbols.enter().append("text")
            .style("opacity", 0)
            .translate(function(d,i){return [i < 2 ? -175 : 50, i % 2 ? 25 : 0]})
          .transition().duration(transDur/2).delay(transDur*order)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(transDur/2)
            .style("opacity", 0)
            .remove();
        symbols.html(function(d){return d})

        symbols.selectAll(".dragM1")
            .call(makeDraggerM1)
        symbols.selectAll(".dragB1")
            .call(makeDraggerB1)
        symbols.selectAll(".dragM2")
            .call(makeDraggerM2)
        symbols.selectAll(".dragB2")
            .call(makeDraggerB2)
        symbols.selectAll(".x1")
    }

    var symbols2 = function(g, order, initialRender){
        if (initialRender){
            g.attr("opacity", 0)
            .transition().duration(transDur).delay(transDur*order)
              .attr("opacity", 1)
        }

        var y1 = hoverX === null ? "y"+utils.sub1 : utils.fmtU(f1(hoverX))
        var y2 = hoverX === null ? "y"+utils.sub2 : utils.fmtU(f2(hoverX))
        g.place("g.y").translate(-20, 0)
            .selectAll("g")
            .data([[y1, "y1"], [y2, "y2"]])
            .call(utils.vec)

        g.place("text.eq")
            .translate(40, 64)
            .text("=")

        g.place("g.m").translate(74, 0)
            .selectAll("g")
            .data([[utils.fmtU(m1)], [utils.fmtU(m2)]])
            .call(utils.vec)
            .each(function(d,i){
                i ? makeDraggerM2(d3.select(this)) : makeDraggerM1(d3.select(this))
            })

        g.place("text.x1")
            .translate(134, 58)
            .style("font-weight", 600)
            .style("font-size", hoverX === null ? "22px" : null)
            .text(hoverX === null ? "x" : utils.fmtU(hoverX,0))

        g.place("text.plus")
            .translate(150, 63)
            .text("+")

        g.place("g.b").translate(180, 0)
            .selectAll("g")
            .data([[utils.fmtU(b1), "b"], [utils.fmtU(b2), "b"]])
            .call(utils.vec)
            .each(function(d,i){
                i ? makeDraggerB2(d3.select(this)) : makeDraggerB1(d3.select(this))
            })

    }

    var linesY = function(g, order){
        var lines = g.selectAll("line.y1, line.y2")
            .data([45, 135])
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d,i){ return -y(f[i](hoverX))})
        lines.enter().append("line")
            .attr("class", function(d,i){return "y"+(i+1)})
            .attr({y1: 0, y2: 0})
            .style("stroke-width", "2px")
          .transition().delay(transDur*order).duration(transDur)
            .attr("y2", function(d,i){ return -y(f[i](hoverX))})
        lines.attr("x1", function(d){ return x(hoverX)})
            .attr("x2", function(d){ return x(hoverX)})
            .attr("transform", function(d){return "rotate("+d+","+x(hoverX)+",0)"})
    }

    var circlesX = utils.makeCircles(transDur, circleSamples, "x1",
        function(sel){sel.attr("r", 0).attr("cx", x(0)).attr("cy", 0)
            .on("mouseover", function(d){ if(!utils.isFrozen()){hoverX = d; render();}})
            .on("mouseout", function(d){ if(!utils.isFrozen()){hoverX = null; render();}})
        },
        function(sel){sel.attr("r", function(d){ return d === hoverX ? 8 : 4})
                         .attr("cx", function(d){ return x(d)})}
    )

    var linesY1 = function(g, order){
        var lines = g.selectAll("line.y1.vert")
            .data(circleSamples)
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", -axisSpacing)
             .attr("x2", function(d){ return x(f1(d))})
        lines.enter().append("line")
            .attr("class", "y1 vert")
            .attr("x1", function(d){ return x(d)})
            .attr("x2", function(d){ return x(d)})
            .attr({y1: 0, y2: 0})
          .transition().delay(transDur).duration(transDur)
            .attr("y2", function(d){ return -x(f1(d))})
          .transition().delay(transDur*3).duration(transDur)
            .style("shape-rendering", "geometricPrecision")
            .attr("y2", -axisSpacing)
            .attr("x2", function(d){ return x(f1(d))})
    }

    var circlesY1 = function(g, order){
        var finalize = function(sel){
            sel.attr("r", function(d){ return d === hoverX ? 7 : 3})
               .attr("cy", -axisSpacing)
               .attr("cx", function(d){ return x(f1(d))})
        }

        var circles = g.selectAll("circle.y1")
            .data(circleSamples)
        circles.call(finalize);
        circles.exit().transition().attr("r", 0).remove();
        circles.enter().append("circle")
            .attr("class", "y1")
            .attr("r", 0)
            .attr("cy", 0)
            .attr("cx", function(d){ return x(d)})
            .on("mouseover", function(d){ if(!utils.isFrozen() && !isZero(m1)){hoverX = d; render();}})
            .on("mouseout", function(d){ if(!utils.isFrozen()){hoverX = null; render();}})
          .transition().duration(transDur).delay(transDur*order)
            .attr("r", 3)
            .attr("cy", function(d){ return -x(f1(d))})
          .transition().duration(transDur).delay(transDur*(order+2))
            .call(finalize)
    }

    var lineY1 = function(g, order, initialRender){
        if (initialRender){
            var startX = x.range()[0], startY = -x(f1(x.domain()[0]));
            var endX = x.range()[1], endY = -x(f1(x.domain()[1]));
            g.append("line")
                .attr("class", "y1")
                .style("shape-rendering", "geometricPrecision")
                .attr({x1: startX, x2: startX, y1: startY, y2: startY})
              .transition().duration(transDur).delay(transDur*order)
                .attr({x2: endX, y2: endY})
              .transition().duration(transDur)
                .attr({y1: -axisSpacing, y2: -axisSpacing})
              .transition().duration(0)
                .style("shape-rendering", null)
        }
    }

    var circlesY2 = utils.makeCircles(transDur, circleSamples, "y2",
        function(sel){sel.attr("r", 0).attr("cx", x).attr("cy", 0)
            .on("mouseover", function(d){ if(!utils.isFrozen() && !isZero(m2)){hoverX = d; render();}})
            .on("mouseout", function(d){ if(!utils.isFrozen()){hoverX = null; render();}})
        },
        function(sel){sel.attr("r", function(d){ return d === hoverX ? 8 : 4})
                         .attr("cy", axisSpacing)
                         .attr("cx", function(d){ return x(f2(d))})}
    )

    var linesY2 = function(g, order){
        var lines = g.selectAll("line.y2.vert")
            .data(circleSamples)
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", axisSpacing)
             .attr("x2", function(d){ return x(f2(d))})
        lines.enter().append("line")
            .attr("class", "y2 vert")
            .attr("x1", x)
            .attr("x2", x)
            .attr({y1: 0, y2: 0})
            .style("shape-rendering", "geometricPrecision")
          .transition().delay(transDur*order).duration(transDur)
            .attr("y2", axisSpacing)
            .attr("x2", function(d){ return x(f2(d))})
    }

    var lineY2 = function(g, order, initialRender){
        if (initialRender){
            g.append("line")
                .attr("class", "y2")
                .attr({x1: 0, x2: 0, y1: axisSpacing, y2: axisSpacing})
              .transition().delay(transDur*order).duration(transDur)
                .attr({x1: x.range()[0], x2: x.range()[1]})
        }
    }


    return function(){render(true);}
}
