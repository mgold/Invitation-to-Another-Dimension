var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = -3.4, m12 = -0.65, m13 = 1.5,
        m21 = 4.8,  m22 = -1.9,  m23 = -1.8;
    var point = false;
    var curPos = null;

    var params = "m11 m12 m13 m21 m22 m23".split(" ");
    var transDur = 1000;

    var makeDragger = function(selection){
        return function(matrixElem){
            selection.select("."+matrixElem)
                .classed("draggerHoriz", true)
                .call(d3.behavior.drag().on("drag", function(){
                    if (!utils.isFrozen()){
                        eval(matrixElem + " += d3.event.dx/20"); // it's not evil, it's metaprogramming!
                        render();
                    }
                }))
        }
    }

    var f = function(a){
        var x1 = a[0], x2 = a[1]
        return [x1*m11 + x2*m12 + m13*point, // multiplying by booleans ;)
                x1*m21 + x2*m22 + m23*point,
                1]
    }

    var rez = 7, halfRez = Math.floor(rez/2);

    var x = d3.scale.linear()
        .domain([-3, 3])
        .range([-200, 200])

    var y = d3.scale.linear()
        .domain([-10, 10])
        .range([x.range()[0]/rez, x.range()[1]/rez])

    var r = d3.scale.sqrt()
        .domain([0, 60])
        .range([1, x(1) - x(0.5)])

    // DOM element selections
    var svg = d3.select("svg.fourth")
    var symbolsParent = svg.append("g")
        .translate(850, 200)
    var plot = svg.append("g")
        .translate(600, 250)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")
    var layer3 = plot.append("g")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 3*transDur);
        }
        params.forEach(function(matrixElem){
            eval(matrixElem + " = utils.clamp(-5, 5, "+matrixElem+")");
        })
        axes(layer1, 0, initialRender)
        circlesX(layer2, 1, initialRender)
        covers(layer3, 0, initialRender)
        symbols(symbolsParent, 2);
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

    var circlesX = function(g, order, initialRender){
        var lineEnds = function(){
            this.attr("x2", function(d){return y(d.y1)})
                .attr("y2", function(d){return -y(d.y2)})
        }
        var bases = g.selectAll("g.base")
            .data(d3.range(rez*rez)
                    .map(function(i){
                        var x1 = i % rez - halfRez, x2 = Math.floor(i / rez) - halfRez,
                            image = f([x1, x2]),
                            y1 = image[0], y2 = image[1];
                        return {i: i, x1: x1, y1: y1, x2: x2, y2: y2}}))
        bases.select("line").call(lineEnds) // update selection only
        var entering = bases.enter().append("g").attr("class", "base")
            .translate(function(d){return [x(d.x1), -x(d.x2)]})
        entering.append("line")
            .attr({x1: 0, y1: 0, x2: 0, y2: 0})
          .transition().delay(transDur*(order+1)).duration(transDur)
            .attr("class", "y")
            .call(lineEnds)
        entering.append("circle").attr("r", 0)
          .transition().delay(transDur*order).duration(transDur)
            .attr({cx: 0, cy: 0, r: 2})

        bases.classed("current", function(d){ return curPos && d.i === curPos.i })
        arrowheads(g, order+1, initialRender);
    }

    var isZero = function(d){
        return y(d.y1*d.y1 + d.y2*d.y2) < 2;
    }

    function arrowheads(g, order, initialRender){
        var markers;
        if (initialRender){
            svg.selectAll(".base").append("g").attr("class", "marker").translate(0,0)
            markers = svg.selectAll(".marker")
            markers.transition().delay(transDur*order).duration(transDur)
                .attr("transform", function(d){return "translate("+y(d.y1)+","+ -y(d.y2)+")"})

            markers.append("circle").attr("class", "roundhead y")
                .attr("r", 0)
              .transition().delay(transDur*order).duration(transDur)
                .attr("r", 2)

            markers.append("path").attr("class", "arrowhead")
                .attr("d", "M 0 0 0 0 0 0 Z")
                .transition().delay(transDur*order).duration(transDur)
                .attr("d", "M 0 0 -6 -3 -6 3 Z")
        }else{
            markers = svg.selectAll(".base").select(".marker");
            markers.translate(function(d){
                return [y(d.y1), -y(d.y2)]})
        }
        markers.select(".roundhead")
            .attr("display", function(d){return isZero(d) ? null : "none"})
        markers.select(".arrowhead")
            .attr("display", function(d){return isZero(d) ? "none" : null})
            .attr("transform", function(d){
                var angle = Math.atan2(d.y1, d.y2) * (360/Math.TAU) - 90;
                return"rotate("+angle+")"})
    }

    function covers(g, order, initialRender){
        var data = [].concat.apply([], svg.selectAll("g.base").data().map(function(d){
            var points = [{x: x(d.x1) + y(d.y1), y: -x(d.x2) - y(d.y2), d: d}];
                if (!isZero(d)){
                    points.push({x: x(d.x1), y: -x(d.x2), d: d});
                }
                return points;
        }))
        var min = x.range()[0] - 30, max = x.range()[1] + 30;
        var voro = d3.geom.voronoi()
            .clipExtent([[min, min], [max, max]])
            .x(function(d){return d.x})
            .y(function(d){return d.y})
        var triangles = voro(data)

        g.selectAll("path")
            .data(triangles)
            .enter()
            .append("path")
            .attr("class", "cover") // comment out to see the voronoi diagram
        g.selectAll("path")
            .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .on("mouseenter", function(d){
                if (!utils.isFrozen()){
                    curPos = d.point.d;
                    render();
                }})
            .on("mouseout", function(d){
                if (!utils.isFrozen()){
                    curPos = null;
                    render();
                }})
    }

    var symbols = function(g, order){
        g.place("g.matrix")
            .selectAll("g")
            .data([[m11.toFixed(2), "param m11"], [m21.toFixed(2), "mOffDiag m21"], [0, "inactive"],
                   [m12.toFixed(2), "mOffDiag m12"], [m22.toFixed(2), "param m22"], [0, "inactive"],
                   [m13.toFixed(2), "b m13"], [m23.toFixed(2), "b m23"], [1, "inactive"]])
            .call(utils.matrix)

        params.forEach(makeDragger(g));

        var x1 = curPos && curPos.x1.toFixed(2) || "x"+utils.sub1
        var x2 = curPos && curPos.x2.toFixed(2) || "x"+utils.sub2
        g.place("g.vectorX")
            .translate(180, 0)
            .selectAll("g")
            .data([[x1, "x1"], [x2, "x2"], [point ? 1 : 0, point ? "point" : "vector"]])
            .call(utils.vec)

        g.select(".point, .vector")
         .on("click", function(){
             if (!utils.isFrozen()){
                 point = !point;
                 render();
             }
         })

        if (curPos){
            g.place("text.eq")
                .translate(240, 90)
                .text("=")
        }else{
            g.select("text.eq").remove();
        }

        var result = g.place("g.vectorY")
          .translate(273, 0)
          .selectAll("g")
        if (!curPos){
          result.remove();
        }else{
          var y1 = curPos && curPos.y1.toFixed(2) || "y1"
          var y2 = curPos && curPos.y2.toFixed(2) || "y2"
          result
              .data([[y1, "y1"], [y2, "y2"], [point ? 1 : 0]])
              .call(utils.vec)
        }

    }

    return function(){render(true);}
}
