var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = -3.4, m12 = -0.65, m13 = 1.5,  m14 = 1.2,
        m21 = 4.8,  m22 = -1.9,  m23 = -1.8, m24 = 0.3,
        m31 = 4.8,  m32 = -1.9,  m33 = -1.8; m34 = -0.9;
    var point = true;
    var curPos = null;
    var isolateComponent = 0;

    var params = "m11 m12 m13 m14 m21 m22 m23 m24 m31 m32 m33 m34".split(" ");
    var transDur = 1500;

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

    /* You know how only 10% of a program is performance critical? This is that part.
     * This function is called 125 times a _frame_. So yes, we're going to optimize out
     * the isolated vector parts, and we're going to do dirty checking in the bind section.
     * Perf testing for dirty checking consisted of __hearing my laptop fans slow down__.
     */
    var f = function(a){
        var x1 = a[0], x2 = a[1], x3 = a[2];
        return [x1*m11 + x2*m12 + x3*m13 + m14*point,
                x1*m21 + x2*m22 + x3*m23 + m24*point,
                x1*m31 + x2*m32 + x3*m33 + m34*point,
                +point
               ]
    }
    f.color = 0x0d47a1;
    var fIso1 = function(a){
        return [a[0]*m11 + a[1]*m12 + a[2]*m13 + m14*point, 0, 0 ]
    }
    fIso1.color = 0x3080f0;
    var fIso2 = function(a){
        return [0, a[0]*m21 + a[1]*m22 + a[2]*m23 + m14*point, 0 ]
    }
    fIso2.color = 0x3596bd;
    var fIso3 = function(a){
        return [0, 0, a[0]*m31 + a[1]*m32 + a[2]*m33 + m14*point ]
    }
    fIso3.color = 0x45c5ef;
    window.vf3_f = f;

    var rez = 7, halfRez = Math.floor(rez/2);

    var x = d3.scale.linear()
        .domain([-3, 3])
        .range([-200, 200])

    var y = d3.scale.linear()
        .domain([-10, 10])
        .range([x.range()[0]/rez, x.range()[1]/rez])

    // DOM element selections
    var svg = d3.select("svg.fifth").style("width", "320px")
    var symbolsParent = svg.append("g")
        .translate(5, 175)
    var storyParent = svg.append("g")
        .translate(0, 410)
        .append("text")
    var mathbox = d3.select(".mathbox")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 2.5*transDur);

            mathbox.attr("src", "vector_field_3d.html")
            setInterval(function(){
                var wid = svg.node().parentNode.getClientRects()[0].width
                var padding = wid - 500 - 30 - 320; // mathbox width, padding, svg width
                mathbox.style("padding-left", padding/2+"px")
            }, 750)
        }

        params.forEach(function(matrixElem){
            eval(matrixElem + " = utils.clamp(-5, 5, "+matrixElem+")");
        })

        symbols(symbolsParent, 1, initialRender);
        story(storyParent, 1, initialRender);
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

        var x1 = curPos && utils.fmtU(curPos.x1, 0) || "x"+utils.sub1
        var x2 = curPos && utils.fmtU(curPos.x2, 0) || "x"+utils.sub2
        var x3 = curPos && utils.fmtU(curPos.x3, 0) || "x"+utils.sub3
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

        var y1 = curPos && utils.fmtU(curPos.y1) || "y"+utils.sub1
        var y2 = curPos && utils.fmtU(curPos.y2) || "y"+utils.sub2
        var y3 = curPos && utils.fmtU(curPos.y3) || "y"+utils.sub3
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

    var pointStory = "A 1 indicates this is a <tspan class='point'>point</tspan>."
    var vectorStory = "A 0 indicates this is a <tspan class='vector'>vector</tspan>."
    var story = function(g, order, initialRender){
        if (initialRender){
            var timeoutID;
            var bind = utils.bind(svg, g, ".component.", function(){f.dirty = true; window.vf3_f = f});

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

            bind("y1", function(){ fIso1.dirty = true; window.vf3_f = fIso1; return "The first output."})
            bind("y2", function(){ fIso2.dirty = true; window.vf3_f = fIso2; return "The second output."})
            bind("y3", function(){ fIso3.dirty = true; window.vf3_f = fIso3; return "The third output."})

            bind("point", function(){ return point ? pointStory : vectorStory })
        }
    }

    return function(){render(true);}
}
