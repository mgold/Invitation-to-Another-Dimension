var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 1, b1 = 0;
    var m2 = 2, b2 = -1;
    var curX = 2;

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
    var makeDraggerB1 = makeDragger(function(){b1 += d3.event.dx/10});
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/10});
    var makeDraggerB2 = makeDragger(function(){b2 += d3.event.dx/10});
    var makeDraggerB2 = makeDragger(function(){b2 += d3.event.dx/10});
    var makeDraggerX = makeDragger(function(){curX += x.invert(d3.event.dx)});

    var x = d3.scale.linear()
            .domain([-3, 3])
            .range([-200, 200])

    // DOM element selections
    var svg = d3.select("svg.second")
    var symbols1Parent = svg.append("g")
        .translate(250, 250)
    var symbols2Parent = svg.append("g")
        .translate(850, 200)
    var plot = svg.append("g")
        .attr("transform", "translate(600, 250) rotate(-45)")
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");
    layer1.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
        .attr("class", "x1")
    layer1.append("line")
        .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})
    var storyParent = d3.select(".essay p.second");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 2*transDur);
        }
        curX = utils.clamp(x.domain()[0], x.domain()[1], curX)
        m1 = utils.clamp(-10, 10, m1)
        m2 = utils.clamp(-10, 10, m2)
        story(storyParent);
        circleX(layer2, 0);
        linesY(layer1, 1);
        symbols1(symbols1Parent, 2);
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
                   "<tspan class=y1>"+f1(curX).toFixed(2)+"</tspan> = <tspan class=dragM1>"+m1.toFixed(2)+"</tspan>×<tspan class=x1>"+curX.toFixed(2)+"</tspan> <tspan class=dragB1>"+utils.b(b1)+"</tspan>",
                   "<tspan class=y2>y"+sub2+"</tspan> = m"+sub2+"<tspan class=x1>x</tspan> + b"+sub2,
                   "<tspan class=y2>"+f2(curX).toFixed(2)+"</tspan> = <tspan class=dragM2>"+m2.toFixed(2)+"</tspan>×<tspan class=x1>"+curX.toFixed(2)+"</tspan> <tspan class=dragB2>"+utils.b(b2)+"</tspan>",
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
        g.place("g.y").translate(-20, 0)
            .selectAll("g")
            .data([[f1(curX).toFixed(2), "y1"], [f2(curX).toFixed(2), "y2"]])
            .call(utils.vec)

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

        g.place("text.x1")
            .translate(134, 58)
            .style("font-weight", "600")
            .text(curX.toFixed(2))
            .call(makeDraggerX)

        g.place("text.plus")
            .translate(170, 63)
            .text("+")

        g.place("g.b").translate(200, 0)
            .selectAll("g")
            .data([[b1.toFixed(2), "b"], [b2.toFixed(2), "b"]])
            .call(utils.vec)
            .each(function(d,i){
                i ? makeDraggerB2(d3.select(this)) : makeDraggerB1(d3.select(this))
            })

    }

    var linesY = function(g, order){
        var lines = g.selectAll("line.y1, line.y2")
            .data([45, 135])
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d,i){ return -x(f[i](curX))})
        lines.enter().append("line")
            .attr("class", function(d,i){return "y"+(i+1)})
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
