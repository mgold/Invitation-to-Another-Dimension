var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 1, b1 = 0;
    var m2 = 2, b2 = -1;
    var curX = 2;

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var f1 = function(x){return m1*x + b1}
    var f2 = function(x){return m2*x + b2}
    var f = [f1, f2]

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()) callback()}))
        }
    }
    var makeDraggerM = makeDragger(function(){m += d3.event.dx/10; render()});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10; render()});

    var x = d3.scale.linear()
            .domain([-5, 5])
            .range([-200, 200])

    // DOM element selections
    var svg = d3.select("svg.second")
    var symbolsParent = svg.append("g")
        .translate(250, 250)
        .attr("id", "symbols")
    var plot = svg.append("g")
        .translate(600, 250)
        .attr("id", "plot")
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");
    layer1.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
    layer1.append("line")
        .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})
    var storyParent = d3.select(".essay p.second");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 4*transDur);
        }
        story(storyParent);
        circleX(layer2, 0);
        linesY(layer1, 1);
        //symbols(symbolsParent, 3);
    }

    var story = function(p){
        p.text("HELLO")
    }

    var symbols = function(g, order){
        var symbols = g.selectAll("text")
            .data(["<tspan class=y1>y</tspan> = m<tspan class=x1>x</tspan> + b",
                   "<tspan class=y1>y</tspan> = <tspan class=dragM>" + m.toFixed(2) + "</tspan><tspan class=x1>x</tspan> + <tspan class=dragB>" + b.toFixed(2) + "</tspan>",
                   "<tspan class=y1>"+f(hoverX).toFixed(2)+"</tspan> = " + m.toFixed(2) + "*<tspan class=x1>"+hoverX+"</tspan> + " + b.toFixed(2)
                   ])
        symbols.enter().append("text")
            .style("opacity", 0)
          .transition().duration(500).delay(transDur*order)
            .style("opacity", 1)
            .attr("dy", "-30px")
        symbols.exit()
          .transition().duration(500)
            .style("opacity", 0)
            .remove();
        symbols.html(function(d,i){return i==2 && hoverX === null ? "" : d})
            .translate(function(d,i){return [0, 30*i]})

        symbols.selectAll(".dragM")
            .call(makeDraggerM)
        symbols.selectAll(".dragB")
            .call(makeDraggerB)
    }

    var linesY = function(g, order){
        var lines = g.selectAll("line.y")
            .data([-1, 1])
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d,i){ return -x(f[i](curX))})
        lines.enter().append("line")
            .attr("class", function(d){return "y y"+d})
            .attr("x1", function(d){ return x(curX) +d})
            .attr("x2", function(d){ return x(curX) +d})
            .attr({y1: 0, y2: 0})
          .transition().delay(transDur).duration(transDur)
            .attr("y2", function(d,i){ return -x(f[i](curX))})
    }

    var circleX = function(g, order){
        var circle = g.selectAll("circle") .data([0])
        circle.exit().transition().attr("r", 0).remove();
        circle.enter().append("circle")
            .attr("class", "x1")
          .transition().duration(transDur).delay(transDur*order)
            .attr("r", 4).attr("cy", 0)
        circle.attr("cx", x(curX))
    }

    return function(){render(true);}
}
