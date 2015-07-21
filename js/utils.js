// Freezing ia a simple counting semaphore to prevent changing the stage during
// a transition.
var _freeze = 0
module.exports.freeze = function(){
    _freeze++;
}
module.exports.unfreeze = function(){
    if (_freeze <= 0) console.warn("Unfreezing when freeze is", _freeze)
    _freeze--;
}
module.exports.isFrozen = function(){
    return _freeze > 0;
}

module.exports.approach = function(target, current, step){
    step = step || 0.1;
    if (Math.abs(target-current) <= step) return target;
    if (target < current) return current-step;
    return current + step;
}

module.exports.clamp = function(lo, hi, val){
    return Math.max(lo, Math.min(hi, val));
}

module.exports.cross = function(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x1: a[i], i: i, x2: b[j], j: j});
    return c;
}

module.exports.sub1 = "<tspan class=sub>1</tspan>"
module.exports.sub2 = "<tspan class=sub>2</tspan>"

module.exports.b = function(b){
    return b < 0.005 ? "- "+Math.abs(b).toFixed(2) : "+ "+b.toFixed(2)
}

// vector and matrix drawing routines

var s = 50, half_s = 25, margin = 4, offset = s+margin;
var components = function(g){
    var entering = g.enter().append("g").attr("class", "component");
    entering.append("rect")
    entering.append("text")
    g.select("rect")
        .attr("class", function(d){return d[1] || "param"})
        .attr({width: s, height: s})
    g.select("text")
        .html(function(d){return d[0]})
        .translate(half_s, half_s+6)
    return entering;
}

module.exports.vec = function(g){
    var entering = components(g);
    g.translate(function(d,i){return [0, (s+margin)*i]})

    if (entering.size()){
        var line = d3.svg.line();
        var h = g.data().length * (s+margin), w = s + 2*margin
        var pad = -margin
        var node = d3.select(g.node()) // clear selection, do only once
        node.append("path").datum([[15+pad, pad], [pad, pad], [pad, h], [15+pad, h]])
            .attr("d", line)
            .attr("class", "brace")
        node.append("path").datum([[w+pad-15, pad], [w+pad, pad], [w+pad, h], [w+pad-15, h]])
            .attr("d", line)
            .attr("class", "brace")
    }
}

module.exports.matrix = function(g){
    var entering = components(g);
    var dim = Math.sqrt(g.data().length);
    g.translate(function(d,i){return [offset * (Math.floor(i/dim)), offset * (i % dim)]})

    if (entering.size()){
        var line = d3.svg.line();
        var h = dim * offset, w = offset*dim + margin;
        var pad = -margin;
        var node = d3.select(g.node()) // clear selection, do only once
        node.append("path").datum([[15+pad, pad], [pad, pad], [pad, h], [15+pad, h]])
            .attr("d", line)
            .attr("class", "brace")
        node.append("path").datum([[w+pad-15, pad], [w+pad, pad], [w+pad, h], [w+pad-15, h]])
            .attr("d", line)
            .attr("class", "brace")
    }

}
