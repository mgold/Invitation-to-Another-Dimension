var utils = require('./utils');

module.exports = function(){
    var mathboxSelection = d3.select(".mathbox")

    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = -3.4, m12 = -0.65, m13 = 1.5,  m14 = 1.2,
        m21 = 4.8,  m22 = -1.9,  m23 = -1.8, m24 = 0.3,
        m31 = 4.8,  m32 = -1.9,  m33 = -1.8; m34 = -0.9;
    var point = true;
    var isolateComponent = 0;
    var mathbox = mathBox({
          element: mathboxSelection.node(),
          plugins: ['core', 'cursor', 'controls'],
          controls: {
                  klass: THREE.OrbitControls,
          },
    });
    if (mathbox.fallback) throw "WebGL error";

    // do this now to avoid a flash of black
    mathboxSelection.style("opacity", 0);
    setTimeout(function(){ // won't work synchronously
        mathbox.three.renderer.setClearColor(new THREE.Color(colors.bg), 1.0);
    }, 0)

    function degToRad(deg){return Math.PI*deg/180}
    var cameraAngleInterpolate = d3.interpolateNumber(degToRad(45), degToRad(225))
    var cameraInclineInterpolate = d3.interpolateNumber(1, 0.2);
    var ease = d3.ease("cubic-in-out");

    var params = "m11 m12 m13 m14 m21 m22 m23 m24 m31 m32 m33 m34".split(" ");
    var transDur = 1500;
    var colors = {bg: "#fafafa", // no easy way to read sass in JS
                  x1: "#c03000",
                  x2: "#85144b",
                  x3: "#a74697",
                  y:  "#0d47a1",
                  y1: "#3080f0",
                  y2: "#3596bd",
                  y3: "#45c5ef"}

    var makeDragger = function(selection){
        return function(matrixElem){
            selection.select("."+matrixElem)
                .classed("draggerHoriz", true)
                .call(d3.behavior.drag().on("drag", function(){
                    if (!utils.isFrozen()){
                        eval(matrixElem + " += d3.event.dx/10"); // it's not evil, it's metaprogramming!
                        render();
                    }
                }))
        }
    }

    var f = function(x1, x2, x3){
        var a =  [x1*m11 + x2*m12 + x3*m13 + m14*point,
                  x1*m21 + x2*m22 + x3*m23 + m24*point,
                  x1*m31 + x2*m32 + x3*m33 + m34*point,
                  +point
                 ]
        if (isolateComponent === 0){
            // do nothing but skip the following checks
        }else if (isolateComponent === 1){
            a[1] = a[2] = 0;
        }else if (isolateComponent === 2){
            a[0] = a[2] = 0;
        }else if (isolateComponent === 3){
            a[0] = a[1] = 0;
        }
        return a;
    }

    // DOM element selections
    var svg = d3.select("svg.fifth")
        .style("width", "320px")
        .style("padding-left", "20px")
    var symbolsParent = svg.append("g")
        .translate(5, 175)
    var storyParent = svg.append("g")
        .translate(0, 410)
        .append("text")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 2.5*transDur);

            adjustPadding();
        }

        params.forEach(function(matrixElem){
            eval(matrixElem + " = utils.clamp(-5, 5, "+matrixElem+")");
        })

        vectorField(mathboxSelection, 0, initialRender);
        symbols(symbolsParent, 1, initialRender);
        story(storyParent, 2, initialRender);
    }

    var adjustPadding = function(){
        var wid = svg.node().parentNode.getClientRects()[0].width // width of div.bg
        var mathboxWidth = +mathboxSelection.select("canvas").style("width").slice(0,3)
        var padding = wid - mathboxWidth - 30 - 320; // mathbox width, padding, svg width
        console.log("new padding:", padding, mathboxWidth)
        mathboxSelection.style("padding-left", padding/2+"px")
    }

    var symbols = function(g, order, initialRender){
        g.place("g.matrix")
            .selectAll("g")
            .data([[utils.fmtU(m11), "param m11"],    [utils.fmtU(m21), "mOffDiag m21"], [utils.fmtU(m31), "mOffDiag m31"], [0, "inactive"],
                   [utils.fmtU(m12), "mOffDiag m12"], [utils.fmtU(m22), "param m22"],    [utils.fmtU(m32), "mOffDiag m32"], [0, "inactive"],
                   [utils.fmtU(m13), "mOffDiag m13"], [utils.fmtU(m23), "mOffDiag m23"], [utils.fmtU(m33), "param m33"],    [0, "inactive"],
                   [utils.fmtU(m14), "b m14"],        [utils.fmtU(m24), "b m24"],        [utils.fmtU(m34), "b m34"],        [1, "inactive"]])
            .call(utils.matrix)
            .call(function(){
                if (initialRender){
                    this.attr("opacity", 0)
                  .transition().duration(transDur/2).delay(transDur*(order+1/2))
                      .attr("opacity", 1)
                }})

        params.forEach(makeDragger(g));

        var x1 = "x"+utils.sub1
        var x2 = "x"+utils.sub2
        var x3 = "x"+utils.sub3
        g.place("g.vectorX")
            .attr("transform", "translate(0, -15), rotate(-90)")
            .selectAll("g")
            .data([[x1, "x1"], [x2, "x2"], [x3, "x3"], [point ? 1 : 0, point ? "point" : "vector"]])
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
            .translate(220, 118)
            .text("=")

        var y1 = "y"+utils.sub1
        var y2 = "y"+utils.sub2
        var y3 = "y"+utils.sub3
        g.place("g.vectorY").translate(250, 0)
            .selectAll("g")
            .data([[y1, "y1"], [y2, "y2"], [y3, "y3"], [point ? 1 : 0, "inactive"]])
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

    var setColor = function(color){
        mathbox.select("vector").set("color", color);
    }

    var pointStory = "A 1 indicates this is a <tspan class='point'>point</tspan>."
    var vectorStory = "A 0 indicates this is a <tspan class='vector'>vector</tspan>."
    var story = function(g, order, initialRender){
        if (initialRender){
            var timeoutID;
            var bind = utils.bind(svg, g, ".component.", function(){
                // do this when hiding overlays
                isolateComponent = 0;
                setColor(colors.y);
            });

            bind("m11", "How much "+utils.x1+" affects "+utils.y1+".")
            bind("m12", "How much "+utils.x2+" affects "+utils.y1+".")
            bind("m13", "How much "+utils.x3+" affects "+utils.y1+".")

            bind("m21", "How much "+utils.x1+" affects "+utils.y2+".")
            bind("m22", "How much "+utils.x2+" affects "+utils.y2+".")
            bind("m23", "How much "+utils.x3+" affects "+utils.y2+".")

            bind("m31", "How much "+utils.x1+" affects "+utils.y3+".")
            bind("m32", "How much "+utils.x2+" affects "+utils.y3+".")
            bind("m33", "How much "+utils.x3+" affects "+utils.y3+".")

            var nothing4Vectors =  "Does nothing for <tspan class='vector'>vectors</tspan>."
            bind("m14", function(){ return point ? "A constant added to "+utils.y1+"</tspan>." : nothing4Vectors})
            bind("m24", function(){ return point ? "A constant added to "+utils.y2+"</tspan>." : nothing4Vectors})
            bind("m34", function(){ return point ? "A constant added to "+utils.y3+"</tspan>." : nothing4Vectors})

            bind("x1", "The first input.")
            bind("x2", "The second input.")
            bind("x3", "The third input.")

            bind("y1", function(){ isolateComponent = 1; setColor(colors.y1); return "The first output."})
            bind("y2", function(){ isolateComponent = 2; setColor(colors.y2); return "The second output."})
            bind("y3", function(){ isolateComponent = 3; setColor(colors.y3); return "The third output."})

            bind("point", function(){ return point ? pointStory : vectorStory })
        }
    }

    var vectorField = function(g, order, initialRender){
        if (initialRender){
            g.transition().duration(1.7*transDur).delay(200)
              .style("opacity", 1)

            var n = 4; // distance in either direction
            mathbox.three.controls.minDistance = mathbox.three.controls.maxDistance = 3;
            mathbox.set({ scale: 720, focus: 3 });
            var theta = cameraAngleInterpolate(0);
            mathbox.camera({ proxy: true, position: [Math.cos(theta), cameraInclineInterpolate(0), Math.sin(theta)] });
            var view = mathbox.cartesian({
                  scale: [2, 2, 2],
                  range: [[-n, n], [-n, n], [-n, n]],
            });
            view.axis({ axis: 1, width: 3, color: colors.x1 });
            view.axis({ axis: 2, width: 3 , color: colors.x2});
            view.axis({ axis: 3, width: 3 , color: colors.x3});
            view.grid({ divideX: n, divideY: n, axes: "xz" });

            n = 2; // distance in either direction
            var rez = 2*n+1; // number of samples per dimension
            view = mathbox.cartesian({
                  range: [[-n, n], [-n, n], [-n, n]],
            });
            view
                .volume({
                    channels: 3, // three dimensions of output
                    items: 2, // each datum calls emit twice, for tip and tail
                    width: rez,
                    height: rez,
                    depth: rez,
                    expr: function (emit, x, y, z, i, j, k){
                        emit(x,y,z);
                        var a = f(x,y,z).map(function(d){ return d / 16 })
                        emit(x+a[0], y+a[1], z+a[2])
                    },
                })
            .vector({
                size: 3,
                end: true,
                color: colors.y
            });

            var duration = 5000;
            d3.timer(function(t){
                var frac = ease(Math.min(1, t/duration));
                var theta = cameraAngleInterpolate(frac);
                mathbox.three.camera.position.set(Math.cos(theta), cameraInclineInterpolate(frac), Math.sin(theta));
                return t > duration;
            }, 2*transDur);
        }
    }

    return function(){render(true);}
}
