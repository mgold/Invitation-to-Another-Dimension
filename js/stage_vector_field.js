var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = -3.4, m12 = -0.65, m13 = 1.5,
        m21 = 4.8,  m22 = -1.9,  m23 = -1.8;
    var point = true;
    var isDragging = false;
    var curPos = null;
    var isolateComponent = 0;
    var balls = [];
    var ballID = 0;

    var params = "m11 m12 m13 m21 m22 m23".split(" ");
    var transDur = 1000;

    var makeDragger = function(selection){
        return function(matrixElem){
            selection.select("."+matrixElem)
                .classed("draggerHoriz", true)
                .call(d3.behavior.drag().on("drag", function(){
                    if (!utils.isFrozen()){
                        eval(matrixElem + " += d3.event.dx/10"); // it's not evil, it's metaprogramming!
                        render();
                    }})
                .on("dragstart", function(){ isDragging = true; })
                .on("dragend", function(){ isDragging = false; }))
        }
    }

    var f = function(a){
        var x1 = a[0], x2 = a[1]

        return [x1*m11 + x2*m12 + m13*point, // multiplying by booleans ;)
                x1*m21 + x2*m22 + m23*point,
                +point]
    }

    var rez = 7, halfRez = Math.floor(rez/2);

    var x = d3.scale.linear()
        .domain([-3, 3])
        .range([-200, 200])

    var y = d3.scale.linear()
        .domain([-10, 10])
        .range([x.range()[0]/rez, x.range()[1]/rez])

    var centerX = window.innerWidth/2;
    // DOM element selections
    var svg = d3.select("svg.fourth")
    var symbolsParent = svg.append("g")
        .translate(centerX+250, 200)
    var storyParent = svg.append("g")
        .translate(centerX+245, 385)
        .append("text")
    var plot = svg.append("g")
        .translate(centerX, 250)
    var layer1 = plot.append("g")
    var layer2 = plot.append("g")
    var layer3 = plot.append("g")
    var ballLayer = plot.append("g")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 3.5*transDur);
            initBalls();
            initLinks();
        }
        params.forEach(function(matrixElem){
            eval(matrixElem + " = utils.clamp(-5, 5, "+matrixElem+")");
            eval("if (Math.abs("+matrixElem+") < 0.01) "+matrixElem+" = 0")
        })
        axes(layer1, 0, initialRender)
        vectors(layer2, 1, initialRender)
        covers(layer3, 0, initialRender)
        symbols(symbolsParent, 3, initialRender);
        story(storyParent, 3, initialRender);
    }

    var initBalls = function(){
        var ki = 0.0006;
        var kr = 0.005;
        plot.on("click", function(){
            if (!utils.isFrozen()){
                var pos = d3.mouse(plot.node()),
                    xPos = x.invert(pos[0]),
                    yPos = x.invert(-pos[1]),
                    vel = f([xPos, yPos])
                balls.push({x: xPos, y: yPos, vx: vel[0]*ki, vy: vel[1]*ki, id: ballID++})
            }
        })

        var colors = d3.scale.category20b().range();
        var randomFill = function(){ return colors[4*Math.floor(Math.random()*5)] }
        var edge = 6;
        d3.timer(function(){
            balls = balls.filter(function(b){
                return !(b.x > edge || b.x < -edge || b.y > edge || b.y < -edge)
            })
            balls = balls.map(function(b){
                var vel = f([b.x, b.y])
                b.x += vel[0]*kr;
                b.y += vel[1]*kr;
                return b;
            })
            var update = ballLayer.selectAll("circle").data(balls, function(b){return b.id});
            update.exit().remove()
            update.enter().append("circle")
                .attr("class", "ball")
                .attr("r", 4)
                .style("fill", randomFill())
            update.attr("cx", function(b){ return x(b.x) })
                  .attr("cy", function(b){ return x(-b.y) })

        })

    }

    initLinks = function(){
        d3.select("#setPoint").node().onclick = function(){
            if (!point){
                point = true;
                setTimeout(render, 0);
            }
            return false;
        }
        d3.select("#setVector").node().onclick = function(){
            if (point){
                point = false;
                setTimeout(render, 0);
            }
            return false;
        }
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

    var vectors = function(g, order, initialRender){
        var lineEnds = function(){
            if (!isolateComponent){
                this.attr("x2", function(d){return y(d.y1)})
                    .attr("y2", function(d){return -y(d.y2)})
                    .attr("class", "y")
            }else if (isolateComponent === 1){
                this.attr("x2", function(d){return y(d.y1)})
                    .attr("y2", 0)
                    .attr("class", "y1")
            }else{
                this.attr("x2", 0)
                    .attr("y2", function(d){return -y(d.y2)})
                    .attr("class", "y2")
            }
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
                if (!isolateComponent){
                    return [y(d.y1), -y(d.y2)]
                }else if (isolateComponent === 1){
                    return [y(d.y1), 0]
                }else{
                    return [0, -y(d.y2)]
                }
            })
        }
        markers.select(".roundhead")
            .attr("display", function(d){return isZero(d) ? null : "none"})
            .attr("class", "roundhead y" + (isolateComponent || ""))
        markers.select(".arrowhead")
            .attr("display", function(d){return isZero(d) ? "none" : null})
            .attr("transform", function(d){
                var angle = Math.atan2(isolateComponent === 2 ? 0 : d.y1, isolateComponent === 1 ? 0 : d.y2)
                return"rotate("+ (angle * (360/Math.TAU) - 90) +")"
             })
            .attr("class", "arrowhead y" + (isolateComponent || ""))
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
        var polys = voro(data).filter(function(d){ return !!d.length })

        g.selectAll("path")
            .data(polys)
            .enter()
            .append("path")
            .attr("class", "cover") // comment out to see the voronoi diagram
        g.selectAll("path")
            .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .on("mouseenter", function(d){
                if (!utils.isFrozen()){
                    curPos = d.point.d;

                    //this "shouldn't" be necessary but it is...
                    var image = f([curPos.x1, curPos.x2]);
                    curPos.y1 = image[0], curPos.y2 = image[1];

                    render();
                }})
            .on("mouseout", function(d){
                if (!utils.isFrozen()){
                    curPos = null;
                    render();
                }})
    }

    var symbols = function(g, order, initialRender){
        g.place("g.matrix")
            .selectAll("g")
            .data([[utils.fmtU(m11), "param m11"], [utils.fmtU(m21), "mOffDiag m21"], [0, "inactive"],
                   [utils.fmtU(m12), "mOffDiag m12"], [utils.fmtU(m22), "param m22"], [0, "inactive"],
                   [utils.fmtU(m13), "b m13"], [utils.fmtU(m23), "b m23"], [1, "inactive"]])
            .call(utils.matrix)
            .call(function(){
                if (initialRender){
                    this.attr("opacity", 0)
                  .transition().duration(transDur/2).delay(transDur*(order+1/2))
                      .attr("opacity", 1)
                }})

        params.forEach(makeDragger(g));

        var x1 = curPos && utils.fmtU(curPos.x1, 0) || "x"+utils.sub1
        var x2 = curPos && utils.fmtU(curPos.x2, 0) || "x"+utils.sub2
        g.place("g.vectorX")
            .attr("transform", "translate(0, -15), rotate(-90)")
            .selectAll("g")
            .data([[x1, "x1"], [x2, "x2"], [point ? 1 : 0, point ? "point" : "vector"]])
            .call(utils.vec)
          .selectAll("text")
            .attr("transform", function(d, i, j){
                var translate = d3.select(this).translate();
                return "translate("+(translate[0]-5)+","+(translate[1]-6)+") rotate(90)"
            })

        g.select("g.vectorX")
            .call(function(){
                if (initialRender){
                    this.attr("opacity", 0)
                  .transition().duration(transDur/2).delay(transDur*order)
                      .attr("opacity", 1)
                }})

        g.select(".point, .vector")
         .classed("stroked", true)
         .on("click", function(){
             if (!utils.isFrozen()){
                 point = !point;
                 storyParent.html(point ? pointStory : vectorStory );
                 render();
             }
         })

        g.place("text.eq")
            .translate(170, 90)
            .text("=")

        var y1 = curPos && utils.fmtU(curPos.y1) || "y"+utils.sub1
        var y2 = curPos && utils.fmtU(curPos.y2) || "y"+utils.sub2
        g.place("g.vectorY").translate(205, 0)
            .selectAll("g")
            .data([[y1, "y1"], [y2, "y2"], [point ? 1 : 0, "inactive"]])
            .call(utils.vec)
        g.select(".vectorY .inactive text")
            .attr("class", point ? "point" : "vector")

        g.selectAll("g.vectorY, text.eq")
          .call(function(){
            if (initialRender){
                this.attr("opacity", 0)
              .transition().duration(transDur/2).delay(transDur*(order+1))
                  .attr("opacity", 1)
            }})
    }

    var pointStory = "A 1 indicates this is a <tspan class='point'>point</tspan>."
    var vectorStory = "A 0 indicates this is a <tspan class='vector'>vector</tspan>."
    var story = function(g, order, initialRender){
        if (initialRender){
            var bind = utils.bind(svg, g, ".component.",
                function(){isolateComponent = 0; render()}, // callback on mouseout
                function(){return isDragging}) // disable on drag

            bind("m11", "How much "+utils.x1+" affects "+utils.y1+".")
            bind("m12", "How much "+utils.x2+" affects "+utils.y1+".")
            bind("m21", "How much "+utils.x1+" affects "+utils.y2+".")
            bind("m22", "How much "+utils.x2+" affects "+utils.y2+".")

            var nothing4Vectors =  "Does nothing for <tspan class='vector'>vectors</tspan>."
            bind("m13", function(){ return point ? "A constant added to "+utils.y1+"." : nothing4Vectors})
            bind("m23", function(){ return point ? "A constant added to "+utils.y2+"." : nothing4Vectors})

            bind("x1", "The first input.")
            bind("x2", "The second input.")
            bind("y1", function(){ isolateComponent = 1; render(); return "The first output."})
            bind("y2", function(){ isolateComponent = 2; render(); return "The second output."})

            bind("point", function(){ return point ? pointStory : vectorStory })

        }
    }

    return function(){render(true);}
}
