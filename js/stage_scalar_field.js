var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m1 = 1, m2 = -2, b = 0.5;
    var curX1 = null, curX2 = null;

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var f = function(d){return m1*d.x1 + m2*d.x2 + b}

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()){callback(); render();}}))
        }
    }
    var makeDraggerM1 = makeDragger(function(){m1 += d3.event.dx/20});
    var makeDraggerM2 = makeDragger(function(){m2 += d3.event.dx/20});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10});
    var makeDraggerX = makeDragger(function(){curX += x.invert(d3.event.dx)});

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
    var storyParent = d3.select(".essay p.third");

    function render(initialRender){
        if (initialRender){
            //utils.freeze();
            //d3.timer(function(){utils.unfreeze(); return true;}, 2*transDur);
        }
        m1 = utils.clamp(-10, 10, m1)
        m2 = utils.clamp(-10, 10, m2)
        b = utils.clamp(-10, 10, b)
        /*
        curX = utils.clamp(x.domain()[0], x.domain()[1], curX)
        story(storyParent);
        */
        axes(layer1, 0, initialRender)
        circlesY(layer2, 1);
        symbols1(symbols1Parent, 2);
        symbols2(symbols2Parent, 3);
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

    var story = function(p){
        p.text("I'm less certain about this visualization but keep reading.")
    }

    var symbols1 = function(g, order){
        var sub1 = "<tspan class=sub>1</tspan>"
        var sub2 = "<tspan class=sub>2</tspan>"
        var symbols = g.selectAll("text")
            .data(["<tspan class=y1>y</tspan> = m"+sub1+"<tspan class=x1>x"+sub1+"</tspan> +  m"+sub2+"<tspan class=x2>x"+sub2+"</tspan> + b",
                   "<tspan class=y1>y</tspan> = <tspan class=dragM1>"+m1.toFixed(2)+"</tspan><tspan class=x1>x"+sub1+"</tspan> <tspan class=dragM2>"+utils.b(m2)+"</tspan><tspan class=x2>x"+sub2+"</tspan> <tspan class=dragB>" + utils.b(b) + "</tspan>"
                   //"<tspan class=y1>"+f1(curX).toFixed(2)+"</tspan> = <tspan class=dragM1>"+m1.toFixed(2)+"</tspan>*<tspan class=x1>"+curX.toFixed(2)+"</tspan> <tspan class=dragB1>"+utils.b(b1)+"</tspan>",
                   ])
        symbols.enter().append("text")
            .style("opacity", 0)
            .translate(function(d,i){return [0, [-20, 10, 40, 70][i]]})
          .transition().duration(500).delay(transDur*order)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(500)
            .style("opacity", 0)
            .remove();
        symbols.html(function(d){return d})

        symbols.selectAll(".dragM1")
            .call(makeDraggerM1)
        symbols.selectAll(".dragM2")
            .call(makeDraggerM2)
        symbols.selectAll(".dragB")
            .call(makeDraggerB)
            .call(function(){console.log(this.size())})
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
          .transition().duration(transDur).delay(transDur*order)
            .attr("r", function(d){return r(Math.abs(f(d)))})
    }

    return function(){render(true);}
}
