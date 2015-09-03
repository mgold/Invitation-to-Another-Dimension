var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    var m = 1, b = 0;
    var hoverX = null;

    var transDur = 1000;
    var f = function(x){return m*x + b}

    var makeDragger = function(callback){
        return function(sel){
            sel.classed("draggerHoriz", true)
               .call(d3.behavior.drag().on("drag", function(){if (!utils.isFrozen()) callback()}))
        }
    }
    var makeDraggerM = makeDragger(function(){m += d3.event.dx/10; render()});
    var makeDraggerB = makeDragger(function(){b += d3.event.dx/10; render()});

    var circleSamples = d3.range(-3, 4);
    var x = d3.scale.linear()
            .domain([-5, 5])
            .range([-200, 200])

    var centerX = window.innerWidth/2;
    // DOM element selections
    var svg = d3.select("svg.first")
    var symbolsParent = svg.append("g")
        .translate(centerX - 350, 250)
        .attr("id", "symbols")
    var plot = svg.append("g")
        .translate(centerX, 250)
        .attr("id", "plot")
    var layer0 = plot.append("g");
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");
    var storyParent = d3.select(".essay p.first");

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 3.5*transDur);
        }
        b = utils.snapTo(0, utils.clamp(-5, 5, b))
        m = utils.snapTo(1, utils.snapTo(0, m))
        story(storyParent);
        axis(layer0, 0, initialRender);
        circlesX(layer2, 0);
        lines(layer1, 1);
        circlesY(layer2, 1);
        dragRot(layer2, 2, initialRender);
        dragVert(layer2, 2, initialRender);
        symbols(symbolsParent, 3);
    }

    var eps = 0.01
    var near = function(a, b){
        return b-eps < a && b + eps > a;
    }
    var story = function(div){
        var paras = div.selectAll("p")
            .data(["placeholder"])

        paras.exit().remove();
        paras.enter().append("p");
        paras.html(function(d,i){
            var b0 = near(b, 0)
            var sb = b.toFixed(2)
            var sb_pretty = b0 ? "0" : Math.abs(sb)
            var sb_verb = "<span class='dragB'>" + (b < 0 ? "subtracts " : "adds ") + sb_pretty + "</span>"
            var sb_ing = (b < 0 ? "subtracting " : "adding ") + sb_pretty

            var m0 = near(m, 0)
            var m1 = near(m, 1)
            var sm_pretty = m0 ? "0" : (m1 ? "1" : m.toFixed(2))
            var sm = "<span class='dragM'>" + sm_pretty + "</span>"

            var x = "<span class=x1>x</span>"

            if (b0 && m1) return "The function shown here multiplies "+x+" by "+sm+" and then "+sb_verb+". In other words, it doesn't change "+x+" at all. This function is called the identity. What other special functions can you find?"
            if (m1) return "The function shown here multiplies "+x+" by "+sm+" and then "+sb_verb+". Multiplying "+x+" by 1 is just "+x+", so this function is only addition, or translation."
            if (m0) return "The function shown here multiplies "+x+" by "+sm+" and then "+sb_verb+". Since anything times zero is zero, it's a constant function, because the values does not depend on "+x+"; it's always "+sb+"."
            if (b0) return "The function shown here multiplies "+x+" by "+sm+" and then "+sb_verb+". Adding zero does nothing, so this function is just multiplication, or scaling."
            var mrange = m > 0 ? (m < 1 ? "between 0 and 1" : "greater than 1") : (m > -1 ? "between -1 and 0" : "less than -1")
            var bigOrSmall = m < 1 && m > -1 ? "smaller" : "larger"
            var neg = m < 0 ? " and the sign flips" : ""
            return "The function shown here multiplies "+x+" by "+sm+" and then "+sb_verb+". Because m is "+mrange+", "+x+" becomes "+bigOrSmall+neg+" (at least before "+sb_ing+")."
        })
        paras.selectAll(".dragB").call(makeDraggerB);
        paras.selectAll(".dragM").call(makeDraggerM);
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

    var symbols = function(g, order){
        var symbols = g.selectAll("text")
            .data(["<tspan class='y1'>y</tspan> = m<tspan class='x1'>x</tspan> + b",
                   "<tspan class='y1'>y</tspan> = <tspan class='dragM'>" + m.toFixed(2) + "</tspan><tspan class='x1'>x</tspan> <tspan class='dragB'>" + utils.fmtB(b, 2) + "</tspan>",
                   "<tspan class='y1'>"+f(hoverX).toFixed(2)+"</tspan> = " + m.toFixed(2) + "×<tspan class='x1'>"+hoverX+"</tspan> " + utils.fmtB(b, 2)
                   ])
        symbols.enter().append("text")
            .style("opacity", 0)
          .transition().duration(transDur/2).delay(transDur*order)
            .style("opacity", 1)
            .attr("dy", "-30px")
        symbols.exit()
          .transition().duration(transDur/2)
            .style("opacity", 0)
            .remove();
        symbols.html(function(d,i){return i==2 && hoverX === null ? "" : d})
            .translate(function(d,i){return [0, 30*i]})

        symbols.selectAll(".dragM")
            .call(makeDraggerM)
        symbols.selectAll(".dragB")
            .call(makeDraggerB)
    }

    var lines = function(g, order){
        var lines = g.selectAll("line.y1")
            .data(circleSamples)
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d){ return -x(f(d))})
        lines.enter().append("line")
            .attr("class", "y1")
            .attr("x1", function(d){ return x(d)})
            .attr("x2", function(d){ return x(d)})
            .attr({y1: 0, y2: 0})
          .transition().delay(transDur).duration(transDur)
            .attr("y2", function(d){ return -x(f(d))})
    }

    var circlesX = utils.makeCircles(transDur, circleSamples, "x1",
        function(sel){sel.attr("r", 0).attr("cx", x(0)).attr("cy", 0)
            .on("mouseover", function(d){ if(!utils.isFrozen()){hoverX = d; render();}})
            .on("mouseout", function(d){ if(!utils.isFrozen()){hoverX = null; render();}})
        },
        function(sel){sel.attr("r", function(d){ return d === hoverX ? 8 : 4})
                         .attr("cx", function(d){ return x(d)})}
    )

    var circlesY = utils.makeCircles(transDur, circleSamples, "y1",
        function(sel){
            sel.attr("r", 0).attr("cy", 0).attr("cx", function(d){ return x(d)})
        },
        function(sel){
            sel.attr("r", function(d){ return d === hoverX ? 7 : 3})
               .attr("cy", function(d){ return -x(f(d))})
        }
    )

    var dragRot = function(g, order, initialRender){
        var dx = x.range()[0]
        var dy = f(x(-3))
        var len = Math.sqrt(dx*dx + dy*dy)
        var rot = Math.atan(m) * -180 / Math.PI;
        var transform = "rotate("+rot+",0,"+-x(b)+") translate(0,"+-x(b)+")";
        if (initialRender){
            var drag = d3.behavior.drag()
                .on("drag", function(){
                    if (utils.isFrozen()) return;
                    if (d3.event.x === 0){
                        m = 9999.99;
                    }else{
                        m = (-d3.event.y-x(b))/d3.event.x;
                    }
                    render();
                })
            var dragHandle = g.append("g")
                .attr("class", "draggerRot dragger")
                .attr("transform", transform)
                .call(drag)
            dragHandle.append("line")
                .attr({x1: -len, x2: -len, y1: 0, y2: 0})
                .attr("class", "y1")
              .transition().duration(transDur).delay(order*transDur)
                .attr({x2: len})
            dragHandle.append("line")
                .attr("class", "cover")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})
        }
        g.select(".draggerRot")
            .attr("transform", transform)
          .selectAll("line").filter(function(){return !this.__transition__})
            .attr({x1: -len, x2: len, y1: 0, y2: 0})
    }

    var dragVert = function(g, order, initialRender){
        if (initialRender){
            var drag = d3.behavior.drag()
                .on("drag", function(){
                    if (utils.isFrozen()) return;
                    b = -x.invert(d3.event.y);
                    render();
                })
            var side = (x(1)-x(0))*0.8
            g.append("rect")
                .attr("class", "cover dragger draggerVert")
                .attr("transform", "translate(0,"+-x(b)+")")
                .attr({x: -side, y: -side, width: 2*side, height: 2*side})
                .call(drag)
        }else{
            g.select(".draggerVert")
                .attr("transform", "translate(0,"+-x(b)+")")
        }
    }

    return function(){render(true);}
}
