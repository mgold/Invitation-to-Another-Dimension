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

    var centerX = window.innerWidth/2;
    // DOM element selections
    var svg = d3.select("svg.third").attr("id", "scalar-field")
    var plot = svg.append("g")
        .translate(centerX, 250)
    var symbols1Parent = svg.append("g")
        .translate(centerX - 420, 250)
    var symbols2Parent = svg.append("g")
        .translate(centerX + 240, 200)
        .attr("class", "symbols")
    var storyParent = svg.append("text")
        .translate(centerX + 260, 335)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")
    var storySliderParent = d3.select("span.third");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 4*transDur);
        }
        m1 = utils.clamp(-10, 10, m1)
        m2 = utils.clamp(-10, 10, m2)
        b = utils.clamp(-10, 10, b)
        storySlider(storySliderParent);
        axes(layer1, 0, initialRender)
        circlesY(layer2, 2);
        symbols1(symbols1Parent, 3);
        symbols2(symbols2Parent, 4.5, initialRender);
        story(storyParent, 4, initialRender);
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
                .transition().duration(transDur).delay(transDur*(order+1))
                .attr({x1: 0, x2: 0, y1: x.range()[0], y2: x.range()[1]})
        }
    }

    var storySlider = function(g){
        g.text(utils.fmtU(b)).call(makeDraggerB)
    }

    var symbols1 = function(g, order){
        var symbols = g.selectAll("text")
            .data([utils.y+" = m"+utils.sub1+utils.x1+" + m"+utils.sub2+utils.x2+" + b",
                   utils.y+" = <tspan class='dragM1'>"+utils.fmtU(m1)+"</tspan>"+utils.x1+" <tspan class='dragM2'>"+utils.fmtB(m2)+"</tspan>"+utils.x2+" <tspan class='dragB'>" + utils.fmtB(b) + "</tspan>",
                   !curX ? "" : "<tspan class='y1'>"+utils.fmtU(f(curX))+"</tspan> = "+utils.fmtU(m1)+"×<tspan class='x1'>"+curX.x1+"</tspan> "+utils.fmtB(m2)+"×<tspan class='x2'>"+curX.x2+"</tspan> " + utils.fmtB(b)
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

        var y = curX ? utils.fmtU(f(curX)) : "y"
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
            .data([[utils.fmtU(m1), "param m1"], [utils.fmtU(m2), "param m2"]])
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
            .text(Math.abs(b).toFixed(1)) //sign is taken care of above
            .style("font-weight", 600)
            .call(makeDraggerB)

    }

    var story = function(g, order, initialRender){
        if (initialRender){
            var timeoutID;
            var bind = utils.bind(svg, g, ".symbols .");

            bind("m1", "How much "+utils.x1+" affects "+utils.y+".")
            bind("m2", "How much "+utils.x2+" affects "+utils.y+".")

            bind("b", "A constant added to "+utils.y+".")

            bind("x1", "The first input.")
            bind("x2", "The second input.")

            bind("y1", "The output.")

            bind("dot", "The dot product, resulting in a scalar.")
            bind("plus", function(){return b > -0.05 ? "Scalar addition." : "Scalar subtraction."})
        }
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
            .attr("cy", function(d){return -x(d.x2)})
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
