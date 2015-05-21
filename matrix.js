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

var x = d3.scale.linear()
        .domain([-5, 5])
        .range([-200, 200])

var y = d3.scale.linear()
        .domain([-5, 5])
        .range([200, -200])

var symbols = svg.append("g")
    .translate(100, 250)
    .attr("id", "symbols")

symbols.append("text").text("a = mx + b")
var dynamic_symbols = symbols.append("text").translate(0, 30)

var plot = svg.append("g")
        .translate(600, 250)
        .attr("id", "plot")

plot.append("line")
    .attr({x1: x.range()[0], x2: x.range()[1], y1: 0, y2: 0})
plot.append("line")
    .attr({x1: x(0), x2: x(0), y1: 10, y2: -10})

var data = d3.range(-3, 4)

function render(m, b, initialRender){
    var f = function(x){return m*x + b}

    dynamic_symbols.text("a = " + m.toFixed(2) + "x + " + b.toFixed(2))

    var circles = plot.selectAll("g.datapoint")
        .data(data)
    circles.exit().transition().attr("r", 0).remove();
    renderDatapoint = function(sel){
        sel.select("circle.x")
            .attr("r", 4)
            .attr("cx", function(d){ return x(d)})
            .attr("cy", 0)
        sel.select("line.a")
            .attr("x1", function(d){ return x(d)})
            .attr("x2", function(d){ return x(d)})
            .attr("y2", function(d){ return -x(f(d))})
    }
    renderDatapoint(circles); // must be before appending to enter selection
    var entering = circles.enter().append("g").attr("class", "datapoint")
    entering.append("circle")
        .attr("class", "x")
        .attr("r", 0)
        .attr("cx", x(0))
        .attr("cy", 0)
    entering.append("line")
        .attr("class", "a")
        .attr({x1: x(0), x2: x(0), y1: 0, y2: 0})

    entering = entering.transition().duration(1000).call(renderDatapoint);

    var dx = x.range()[0]
    var dy = f(x(-3))
    var len = Math.sqrt(dx*dx + dy*dy)
    if (initialRender){
        entering.each("end", function (d, i){
            if (i) return;
            var drag = d3.behavior.drag()
                    .on("drag", function(evt){
                        if (d3.event.x == 0){
                            render(9999.99, b)
                        }else{
                            render(-d3.event.y/d3.event.x, b);
                        }
                    })
            var rot = Math.atan(m) * -180 / Math.PI;
            var dragHandle = plot.append("g")
                .attr("id", "dragger")
                .attr("transform", "rotate("+rot+") translate(0,"+b+")")
                .call(drag)
            dragHandle.append("line")
                .attr({x1: -len, x2: -len, y1: 0, y2: 0})
                .attr("class", "a")
                .transition()
                .duration(1000)
                .attr({x2: len})
            dragHandle.append("line")
                .attr("class", "cover")
                .attr({x1: -len, x2: len, y1: 0, y2: 0})
        })
    }else{
        var rot = Math.atan(m) * -180 / Math.PI;
        d3.select("#dragger")
            .attr("transform", "rotate("+rot+") translate(0,"+b+")")
          .select("line")
            .attr({x1: -len, x2: len, y1: 0, y2: 0})
    }
}
render(1, 0, true);
