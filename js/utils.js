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
module.exports.snapTo = function(target, val){
    return Math.abs(target - val) < 0.06 ? target : val;
}

module.exports.cross = function(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x1: a[i], i: i, x2: b[j], j: j});
    return c;
}

module.exports.sub1 = sub1 = "<tspan class='sub'>1</tspan>"
module.exports.sub2 = sub2 = "<tspan class='sub'>2</tspan>"
module.exports.sub3 = sub3 = "<tspan class='sub'>3</tspan>"

module.exports.x  = "<tspan class='x1'>x</tspan>"
module.exports.x1 = "<tspan class='x1'>x"+sub1+"</tspan>"
module.exports.x2 = "<tspan class='x2'>x"+sub2+"</tspan>"
module.exports.x3 = "<tspan class='x3'>x"+sub3+"</tspan>"
module.exports.y  = "<tspan class='y1'>y</tspan>"
module.exports.y1 = "<tspan class='y1'>y"+sub1+"</tspan>"
module.exports.y2 = "<tspan class='y2'>y"+sub2+"</tspan>"
module.exports.y3 = "<tspan class='y3'>y"+sub3+"</tspan>"

// render a number with a binary plus/minus
module.exports.fmtB = function(b, p){
    p = p === undefined ? 1 : p; //falsey zero prevents ||
    return b < -0.005 ? "- "+Math.abs(b).toFixed(p) : "+ "+Math.abs(b).toFixed(p)
}
// render a number with a unary minus or nothing
module.exports.fmtU = function(b, p){
    p = p === undefined ? 1 : p;
    return b < -0.005 ? "-"+Math.abs(b).toFixed(p) : Math.abs(b).toFixed(p)
}

module.exports.makeCircles = function(transDur, circleSamples, className, initialize, finalize){
    return function(g, order){
        var circles = g.selectAll("circle."+className)
            .data(circleSamples)
        circles.call(finalize);
        circles.exit().transition().attr("r", 0).remove();
        circles.enter().append("circle")
            .attr("class", className)
            .call(initialize)
          .transition().duration(transDur).delay(transDur*order)
            .call(finalize)
    }
}


module.exports.bind = function(svg, g, baseSel, cb){
    baseSel = baseSel || "";
    var timeoutID;
    return function(sel, html){
    svg.selectAll(baseSel+sel)
        .on("mouseenter", function(){
            if (!module.exports.isFrozen()){
                clearTimeout(timeoutID); // it's safe to clear an invalid ID
                if (cb) cb(); // yes, this might happen twice, shh
                typeof html === "function" ? g.html(html()) : g.html(html)
            }
        })
        .on("mouseleave", function(){
            timeoutID = setTimeout(function(){ g.text(""); if (cb) { cb() } }, 100);
            // don't hide it immediately to prevent flicker
        })
    }
}
// vector and matrix drawing routines

var s = 50, half_s = 25, margin = 4, offset = s+margin;
var components = function(g){
    var entering = g.enter().append("g")
    entering.append("rect")
    entering.append("text")
    g.attr("class", function(d){return "component " + (d[1] || "param")})
    g.select("rect")
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
        var node = d3.select(g.node().parentNode) // clear selection, do only once
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
