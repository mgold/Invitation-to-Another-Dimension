// Freezing ia a simple counting semaphore to prevent changing the stage during
// a transition.
var _freeze = 0
function freeze(){
    _freeze++;
}
function unfreeze(){
    if (_freeze <= 0) console.warn("Unfreezing when freeze is", _freeze)
    _freeze--;
}
function isFrozen(){
    return _freeze > 0;
}

function approach(target, current, step){
    step = step || 0.1;
    if (Math.abs(target-current) <= step) return target;
    if (target < current) return current-step;
    return current + step;
}

var svg = d3.select("svg")
    .attr("width", screen.width)
    .attr("height", 500)

svg.append("g")
    .translate(100, 250)
    .attr("id", "symbols")

svg.append("g")
    .translate(600, 250)
    .attr("id", "plot")

function makeDragger(sel, callback){
    sel.classed("draggerHoriz", true)
       .call(d3.behavior.drag().on("drag", callback))
}

function stage_linear(){
    var x = d3.scale.linear()
            .domain([-5, 5])
            .range([-200, 200])

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var m = 1, b = 0;
    var f = function(x){return m*x + b}

    var symbolsParent = svg.select("#symbols")
    var storyParent = d3.select("#explanation");

    var plot = svg.select("#plot");
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");
    layer1.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
    layer1.append("line")
        .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})

    function render(initialRender){
        if (initialRender){
            freeze();
            d3.timer(function(){unfreeze(); return true;}, 4*transDur);
        }
        story(storyParent);
        circlesX(layer2, 0);
        lines(layer1, 1);
        circlesA(layer2, 1);
        dragRot(layer2, 2, initialRender);
        dragVert(layer2, 2, initialRender);
        symbols(symbolsParent, 3);
    }

    var story = function(div){
        var paras = div.selectAll("p")
            .data(["A linear function for an input (called x) does two things. First it <i>scales</i> x by multiplying it by a scale factor called m. Then it <i>translates</i> the result by adding another value, called b. The output we call <span class=a>y</span>.",
        "You can adjust these values in the equations, in the text below, or on the graph itself directly.",
        "placeholder"])

        paras.exit().remove();
        paras.enter().append("p");
        paras.html(function(d,i){
            if (i !== 2) return d;
            var sb = (b < 0 ? "subtracts " : "adds ") + Math.abs(b).toFixed(2)
            var sm = m.toFixed(2)
            var b0 = -0.1 < b && b < 0.1;
            var m0 = -0.1 < m && m < 0.1;
            var m1 = 0.9 < m && m < 1.1;
            if (b0 && m1) return "The function shown here multiplies x by 1 and then adds 0. In other words, it doesn't change x at all. Geometrically, this means that all triangles are isoceles: the input equals the output.  This function is called the identity."
            if (m1) return "The function shown here multiplies x by 1 and then "+sb+". Multiplying x by 1 is just x, so this function is just addition, or translation, by "+sb+"."
            if (b0) return "The function shown here multiplies x by "+sm+" and then adds 0. Adding zero does nothing, so this function is just multiplication, or scaling, by "+sm+"."
            if (m0) return "The function shown here multiplies x by 0 and then "+sb+". Since anything times zero is zero, it's a constant function, because the values does not depend on x; it's always "+sb+"."
            var mrange = m > 0 ? (m < 1 ? "between 0 and 1" : "greater than 1") : (m > -1 ? "between -1 and 0" : "less than -1")
            var bigOrSmall = m < 1 && m > -1 ? "smaller" : "larger"
            var neg = m < 0 ? " and the sign flips" : ""
            return "The function shown here multiplies x by "+sm+" and then "+sb+". Because m is "+mrange+", x becomes "+bigOrSmall+neg+" (at least before adding b)."
        })
    }

    var symbols = function(g, order){
        var symbols = g.selectAll("text")
            .data(["<tspan class=a>y</tspan> = mx + b",
                   "<tspan class=a>y</tspan> = <tspan class=dragM>" + m.toFixed(2) + "</tspan>x + <tspan class=dragB>" + b.toFixed(2) + "</tspan>"])
        symbols.enter().append("text")
            .style("opacity", 0)
          .transition().duration(500).delay(transDur*order)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(500)
            .style("opacity", 0)
            .remove();
        symbols.html(function(d){return d})
            .translate(function(d,i){return [0, 30*i]})

        symbols.selectAll(".dragM")
            .call(makeDragger, function(){m += d3.event.dx/10; render()})
        symbols.selectAll(".dragB")
            .call(makeDragger, function(){b += d3.event.dx/10; render()})
    }

    var lines = function(g, order){
        var lines = g.selectAll("line.a")
            .data(data)
        lines.exit().transition().style("opacity", 0).remove();
        lines.attr("y2", function(d){ return -x(f(d))})
        lines.enter().append("line")
            .attr("class", "a")
            .attr("x1", function(d){ return x(d)})
            .attr("x2", function(d){ return x(d)})
            .attr({y1: 0, y2: 0})
          .transition().delay(transDur).duration(transDur)
            .attr("y2", function(d){ return -x(f(d))})
    }

    var makeCircles = function(className, initialize, finalize){
        return function(g, order){
            var circles = g.selectAll("circle."+className)
                .data(data)
            circles.call(finalize);
            circles.exit().transition().attr("r", 0).remove();
            circles.enter().append("circle")
                .attr("class", className)
                .call(initialize)
              .transition().duration(transDur).delay(transDur*order)
                .call(finalize)
        }
    }

    var circlesX = makeCircles("x",
        function(sel){sel.attr("r", 0).attr("cx", x(0)).attr("cy", 0)},
        function(sel){sel.attr("r", 4).attr("cx", function(d){ return x(d)})}
    )

    var circlesA = makeCircles("a",
        function(sel){
            sel.attr("r", 0).attr("cy", 0).attr("cx", function(d){ return x(d)})
        },
        function(sel){
            sel.attr("r", 3)
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
                    if (d3.event.x === 0){
                        m = 9999.99;
                    }else{
                        m = (-d3.event.y-x(b))/d3.event.x;
                    }
                    render();
                })
            var dragHandle = g.append("g")
                .attr("id", "draggerRot")
                .attr("class", "dragger")
                .attr("transform", transform)
                .call(drag)
            dragHandle.append("line")
                .attr({x1: -len, x2: -len, y1: 0, y2: 0})
                .attr("class", "a")
              .transition().duration(transDur).delay(order*transDur)
                .attr({x2: len})
            dragHandle.append("line")
                .attr("class", "cover")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})
        }
        g.select("#draggerRot")
            .attr("transform", transform)
          .select("line").filter(function(){return !this.__transition__})
            .attr({x1: -len, x2: len, y1: 0, y2: 0})
    }

    var dragVert = function(g, order, initialRender){
        if (initialRender){
            var drag = d3.behavior.drag()
                .on("drag", function(){
                    b = -x.invert(d3.event.y);
                    render();
                })
            var side = (x(1)-x(0))*0.8
            g.append("rect")
                .attr("id", "draggerVert")
                .attr("class", "cover dragger")
                .attr("transform", "translate(0,"+-x(b)+")")
                .attr({x: -side, y: -side, width: 2*side, height: 2*side})
                .call(drag)
        }else{
            g.select("#draggerVert")
                .attr("transform", "translate(0,"+-x(b)+")")
        }
    }

    render(1, 0, true);
}

stage_linear();
