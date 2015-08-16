var utils = require('./utils')

var headings = d3.selectAll(".heading")
    .data(function(){
        return this.map(function(d){
            var x = +d.getAttribute("data-x"), y = +d.getAttribute("data-y")
            var radii = [20, 15, 10]
            var xOffsets = [22, 17, 12]
            return [{n: x, klass: "x", x: 20, r: radii[x-1], xOffset: xOffsets[x-1],
                        y: d3.scale.ordinal().domain(d3.range(x)).rangeRoundPoints([0, 100], 2) },
                    {n: y, klass: "y", x: 120, r: radii[y-1], xOffset: -4-xOffsets[y-1],
                        y: d3.scale.ordinal().domain(d3.range(y)).rangeRoundPoints([0, 100], 2) }]
        })
    })

var repeat = function(d){
    return d3.range(d.n).map(function(){return d})
}

var circles = function(ind){
    headings.selectAll("empty")
        .data(function(d){ return repeat(d[ind]) })
        .enter()
        .append("circle")
        .attr("r", function(d){ return d.r })
        .attr("cx", function(d){ return d.x })
        .attr("cy", function(d,i){ return d.y(i) })
        .attr("class", function(d,i){return d.klass+(i+1)})
}

circles(0)
circles(1)

headings.selectAll("line")
    .data(function(d){ return utils.cross(repeat(d[0]), repeat(d[1])) })
    .enter()
    .append("line")
    .attr("class", "connector")
    .attr("x1", function(d){ return d.x1.x + d.x1.xOffset })
    .attr("x2", function(d){ return d.x2.x + d.x2.xOffset })
    .attr("y1", function(d){ return d.x1.y(d.i) })
    .attr("y2", function(d){ return d.x2.y(d.j) })

headings.selectAll("path")
    .data(function(d){ return repeat(d[1]) })
    .enter()
    .append("path")
    .translate(function(d,i){ return [d.x + d.xOffset, d.y(i)] })
    .attr("class", "connector")
    .attr("d", "M -3 -3 3 0 -3 3 Z")

var word = function(n){
    switch (n){
        case 1: return "One"
        case 2: return "Two"
        case 3: return "Three"
    }
}

var s = function(n){ return n === 1 ? "" : "s" }

headings.append("text")
    .translate(150, 56)
    .text(function(d){ return word(d[0].n) + " Input"+s(d[0].n) + ", " + word(d[1].n) + " Output"+s(d[1].n) })
