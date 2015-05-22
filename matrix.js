var _freeze = 0
function freeze(){
    _freeze++;
}
function unfreeze(){
    if (_freeze <= 0) console.warn("Unfreezing when freeze is", _freeze)
    _freeze--;
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

function state_linear(){
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
    var layer3 = plot.append("g");
    layer2.append("line")
        .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
    layer2.append("line")
        .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})
    // TODO: Use these layers to put the vertical lines under the black circles


    // TODO: refactor this into smaller functions
    function render(initialRender){
        var symbols = d3.select("#symbols").selectAll("text")
            .data(["a = mx + b", "a = " + m.toFixed(2) + "x + " + b.toFixed(2)])
        symbols.enter().append("text")
            .style("opacity", 0)
          .transition().duration(500).delay(transDur*3)
            .style("opacity", 1)
        symbols.exit()
          .transition().duration(500)
            .style("opacity", 0)
            .remove();
        symbols.text(function(d){return d})
            .translate(function(d,i){return [0, 30*i]})


        var circles = plot.selectAll("g.datapoint")
            .data(data)
        circles.exit().transition().attr("r", 0).remove();

        renderCircleX = function(sel){
            sel.attr("r", 4)
               .attr("cx", function(d){ return x(d)})
        }
        renderLineA = function(sel){
            sel.attr("y2", function(d){ return -x(f(d))})
        }
        renderCircleA = function(sel){
            sel.attr("r", function(d){return d ? 4 : 3})
               .attr("cy", function(d){ return -x(f(d))})
        }

        // update selection only - must be called before appending to enter
        circles.select("circle.x").call(renderCircleX)
        circles.select("line.a").call(renderLineA)
        circles.select("circle.a").call(renderCircleA)

        var entering = circles.enter().append("g").attr("class", "datapoint")

        entering.append("circle")
            .attr("class", "x")
            .attr("r", 0)
            .attr("cx", x(0))
            .attr("cy", 0)
          .transition().duration(transDur)
            .call(renderCircleX)

        entering.append("line")
            .attr("class", "a")
            .attr("x1", function(d){ return x(d)})
            .attr("x2", function(d){ return x(d)})
            .attr({y1: 0, y2: 0})
          .transition().delay(transDur).duration(transDur)
            .call(renderLineA)

        entering.append("circle")
            .attr("r", 0)
            .attr("cx", function(d){ return x(d)})
            .attr("cy", 0)
            .attr("class", "a")
          .transition().delay(transDur).duration(transDur)
            .call(renderCircleA)

        var dx = x.range()[0]
        var dy = f(x(-3))
        var len = Math.sqrt(dx*dx + dy*dy)
        var rot = Math.atan(m) * -180 / Math.PI;
        if (initialRender){
            var dragRot = d3.behavior.drag()
                .on("drag", function(evt){
                    if (d3.event.x == 0){
                        m = 9999.99;
                    }else{
                        m = (-d3.event.y-x(b))/d3.event.x;
                    }
                    render();
                })
            var dragHandle = plot.append("g")
                .attr("id", "draggerRot")
                .attr("class", "dragger")
                .attr("transform", "rotate("+rot+") translate(0,"+-x(b)+")")
                .call(dragRot)
            dragHandle.append("line")
                .attr({x1: -len, x2: -len, y1: 0, y2: 0})
                .attr("class", "a")
              .transition().duration(transDur).delay(2*transDur)
                .attr({x2: len})
            dragHandle.append("line")
                .attr("class", "cover")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})

            var dragVert = d3.behavior.drag()
                .on("drag", function(evt){
                    b = -x.invert(d3.event.y)
                    render();
                })
            var side = (x(1)-x(0))*0.8
            plot.append("rect")
                .attr("id", "draggerVert")
                .attr("class", "cover dragger")
                .attr("transform", "translate(0,"+-x(b)+")")
                .attr("x", -side)
                .attr("y", -side)
                .attr("width", 2*side)
                .attr("height", 2*side)
                .call(dragVert)
        }else{
            d3.select("#draggerRot")
                .attr("transform", "rotate("+rot+",0,"+-x(b)+") translate(0,"+-x(b)+")")
              .select("line")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})
            d3.select("#draggerVert")
                .attr("transform", "translate(0,"+-x(b)+")")
        }
    }

    freeze();
    d3.timer(function(){unfreeze(); return true;}, 4*transDur);
    render(1, 0, true);
}

state_linear();
