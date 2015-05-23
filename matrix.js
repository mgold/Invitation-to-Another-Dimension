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

var svg = d3.select("svg")
    .attr("width", screen.width)
    .attr("height", screen.height)

svg.append("g")
    .translate(100, 250)
    .attr("id", "symbols")

svg.append("g")
    .translate(600, 250)
    .attr("id", "plot")

function stage_linear(){
    var x = d3.scale.linear()
            .domain([-5, 5])
            .range([-200, 200])

    var data = d3.range(-3, 4)
    var transDur = 1000;
    var m = 1, b = 0;
    var f = function(x){return m*x + b}

    var plot = svg.select("#plot");
    var layer1 = plot.append("g");
    var layer2 = plot.append("g");
    layer1.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
    layer1.append("line")
        .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})

    function render(initialRender){
        freeze();
        circlesX(layer2, 0);
        lines(layer1, 1);
        circlesA(layer2, 1);
        dragging(layer2, 2, initialRender);
        symbols(svg.select("#symbols"), 3);
        d3.timer(function(){unfreeze(); return true;}, 4*transDur);
    }

    var symbols = function(g, order){
        var symbols = g.selectAll("text")
            .data(["a = mx + b", "a = " + m.toFixed(2) + "x + " + b.toFixed(2)])
        symbols.enter().append("text")
            .style("opacity", 0)
          .transition().duration(500).delay(transDur*order)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(500)
            .style("opacity", 0)
            .remove();
        symbols.text(function(d){return d})
            .translate(function(d,i){return [0, 30*i]})
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

    var dragging = function(g, order, initialRender){
        var dx = x.range()[0]
        var dy = f(x(-3))
        var len = Math.sqrt(dx*dx + dy*dy)
        var rot = Math.atan(m) * -180 / Math.PI;
        if (initialRender){
            dragRot(g, order, len);
            dragVert(g, order);
        }else{
            g.select("#draggerRot")
                .attr("transform", "rotate("+rot+",0,"+-x(b)+") translate(0,"+-x(b)+")")
              .select("line")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})
            g.select("#draggerVert")
                .attr("transform", "translate(0,"+-x(b)+")")
        }
    }

    var dragRot = function(g, order, len){
        var drag = d3.behavior.drag()
            .on("drag", function(evt){
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
            .attr("transform", "rotate(-45) translate(0,"+-x(b)+")")
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

    var dragVert = function(g, order){
        var drag = d3.behavior.drag()
        .on("drag", function(evt){
            b = -x.invert(d3.event.y)
            render();
        })
        var side = (x(1)-x(0))*0.8
        g.append("rect")
            .attr("id", "draggerVert")
            .attr("class", "cover dragger")
            .attr("transform", "translate(0,"+-x(b)+")")
            .attr("x", -side)
            .attr("y", -side)
            .attr("width", 2*side)
            .attr("height", 2*side)
            .call(drag)
    }

    render(1, 0, true);
}

stage_linear();
