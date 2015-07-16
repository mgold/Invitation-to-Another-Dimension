var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 1, m2 = 2, b = 0;
    var curX1 = 2, curX2 = -1;

    var data = d3.range(-3, 4)
    var transDur = 0 //1000;
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
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/10});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10});
    var makeDraggerX = makeDragger(function(){curX += x.invert(d3.event.dx)});

    var x = d3.scale.linear()
            .domain([-3, 3])
            .range([-200, 200])

    // DOM element selections
    var svg = d3.select("svg.third")
    var symbols1Parent = svg.append("g")
        .translate(250, 250)
    var symbols2Parent = svg.append("g")
        .translate(850, 200)
    var plot = svg.append("g")
        .translate(600, 250)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")
    layer1.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
        .attr("class", "x1")
    layer1.append("line")
        .attr({x1: 0, x2: 0, y1: x.range()[0], y2: x.range()[1]})
        .attr("class", "x2")
    var storyParent = d3.select(".essay p.third");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 2*transDur);
        }
        /*
        curX = utils.clamp(x.domain()[0], x.domain()[1], curX)
        m1 = utils.clamp(-10, 10, m1)
        m2 = utils.clamp(-10, 10, m2)
        story(storyParent);
        circleX(layer2, 0);
        linesY(layer1, 1);
        symbols1(symbols1Parent, 2);
        */
        symbols2(symbols2Parent, 3);
    }

    var story = function(p){
        p.text("I'm less certain about this visualization but keep reading.")
    }

    var symbols1 = function(g, order){
        var sub1 = "<tspan class=sub>1</tspan>"
        var sub2 = "<tspan class=sub>2</tspan>"
        var symbols = g.selectAll("text")
            .data(["<tspan class=y1>y"+sub1+"</tspan> = m"+sub1+"<tspan class=x1>x</tspan> + b"+sub1,
                   "<tspan class=y1>"+f1(curX).toFixed(2)+"</tspan> = <tspan class=dragM1>"+m1.toFixed(2)+"</tspan>*<tspan class=x1>"+curX.toFixed(2)+"</tspan> <tspan class=dragB1>"+utils.b(b1)+"</tspan>",
                   "<tspan class=y2>y"+sub2+"</tspan> = m"+sub2+"<tspan class=x1>x</tspan> + b"+sub2,
                   "<tspan class=y2>"+f2(curX).toFixed(2)+"</tspan> = <tspan class=dragM2>"+m2.toFixed(2)+"</tspan>*<tspan class=x1>"+curX.toFixed(2)+"</tspan> <tspan class=dragB2>"+utils.b(b2)+"</tspan>",
                   ])
        symbols.enter().append("text")
            .style("opacity", 0)
            .translate(function(d,i){return [0, [-60, -30, 40, 70][i]]})
          .transition().duration(500).delay(transDur*order)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(500)
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
    }

    var symbols2 = function(g, order){
        g.place("text.y1")
            .translate(20, 58)
            .text("y")
            .style("font-weight", 600)

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

        g.place("g.x").translate(160, 0)
            .selectAll("g")
            .data([["x1", "x1"], ["x2", "x2"]])
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

    var linesY = function(g, order){
        var lines = g.selectAll("line.y")
            .data([45, 135])
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d,i){ return -x(f[i](curX))})
        lines.enter().append("line")
            .attr("class", function(d,i){return "y y"+(i+1)})
            .attr({y1: 0, y2: 0})
            .style("stroke-width", "2px")
          .transition().delay(transDur).duration(transDur)
            .attr("y2", function(d,i){ return -x(f[i](curX))})
        lines.attr("x1", function(d){ return x(curX)})
            .attr("x2", function(d){ return x(curX)})
            .attr("transform", function(d){return "rotate("+d+","+x(curX)+",0)"})
    }

    var circleX = function(g, order){
        var circle = g.selectAll("circle") .data([0])
        circle.exit().transition().attr("r", 0).remove();
        circle.enter().append("circle")
            .attr("class", "x1")
          .transition().duration(transDur).delay(transDur*order)
            .attr("r", 4).attr("cy", 0)
        circle.attr("cx", x(curX)).call(makeDraggerX).style("cursor", "nesw-resize")
    }

    return function(){render(true);}
}
