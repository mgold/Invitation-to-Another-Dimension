var utils = require('./utils');
module.exports = function(){
    // These are the only ones that actually vary - the rest are constants. Silly JavaScript.
    // Matrix index notation is row then column
    var m11 = -3.4, m12 = -0.65, m13 = 1.5,  m14 = 1.2,
        m21 = 4.8,  m22 = -1.9,  m23 = -1.8, m24 = 0.3,
        m31 = 4.8,  m32 = -1.9,  m33 = -1.8; m34 = -0.9;
    var point = true;
    var curPos = null;

    var params = "m11 m12 m13 m14 m21 m22 m23 m24 m31 m32 m33 m34".split(" ");
    var transDur = 1000;

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

    var f = function(a){
        var x1 = a[0], x2 = a[1], x3 = a[2];
        return [x1*m11 + x2*m12 + x3*m13 + m14*point, // multiplying by booleans ;)
                x1*m21 + x2*m22 + x3*m23 + m24*point,
                x1*m31 + x2*m32 + x3*m33 + m34*point,
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
    var svg = d3.select("svg.fifth")
    var symbolsParent = svg.append("g")
        .translate(centerX+150, 175)
    var storyParent = svg.append("g")
        .translate(centerX+145, 410)
        .append("text")

    function render(initialRender){
        if (initialRender){
            utils.freeze();
            d3.timer(function(){utils.unfreeze(); return true;}, 1.5*transDur);
        }
        params.forEach(function(matrixElem){
            eval(matrixElem + " = utils.clamp(-5, 5, "+matrixElem+")");
        })
        symbols(symbolsParent, 0, initialRender);
        story(storyParent, 0, initialRender);
    }

    var symbols = function(g, order, initialRender){
        g.place("g.matrix")
            .selectAll("g")
            .data([[m11.toFixed(1), "param m11"],    [m21.toFixed(1), "mOffDiag m21"], [m31.toFixed(1), "mOffDiag m31"], [0, "inactive"],
                   [m12.toFixed(1), "mOffDiag m12"], [m22.toFixed(1), "param m22"],    [m32.toFixed(1), "mOffDiag m32"], [0, "inactive"],
                   [m13.toFixed(1), "mOffDiag m13"], [m23.toFixed(1), "mOffDiag m23"], [m33.toFixed(1), "param m33"],    [0, "inactive"],
                   [m14.toFixed(1), "b m14"],        [m24.toFixed(1), "b m24"],        [m34.toFixed(1), "b m34"],        [1, "inactive"]])
            .call(utils.matrix)
            .call(function(){
                if (initialRender){
                    this.attr("opacity", 0)
                  .transition().duration(transDur/2).delay(transDur*(order+1/2))
                      .attr("opacity", 1)
                }})

        params.forEach(makeDragger(g));

        var x1 = curPos && curPos.x1.toFixed(0) || "x"+utils.sub1
        var x2 = curPos && curPos.x2.toFixed(0) || "x"+utils.sub2
        var x3 = curPos && curPos.x3.toFixed(0) || "x"+utils.sub3
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

        var y1 = curPos && curPos.y1.toFixed(1) || "y"+utils.sub1
        var y2 = curPos && curPos.y2.toFixed(1) || "y"+utils.sub2
        var y3 = curPos && curPos.y3.toFixed(1) || "y"+utils.sub3
        g.place("g.vectorY").translate(250, 0)
            .selectAll("g")
            .data([[y1, "y1"], [y2, "y2"], [y3, "y3"], [point ? 1 : 0]])
            .call(utils.vec)

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
            var bind = function(sel, html){
                svg.select(".component."+sel)
                    .on("mouseenter", function(){
                        if (!utils.isFrozen()){
                            clearTimeout(timeoutID) // it's safe to clear an invalid ID
                            typeof html === "function" ? g.html(html()) : g.html(html)
                        }
                    })
                    .on("mouseleave", function(){
                        timeoutID = setTimeout(function(){ g.text("") }, 100);
                        // don't hide it immediately to prevent flicker
                    })
            }

            bind("m11", "How much <tspan class='x1'>x"+utils.sub1+"</tspan> affects <tspan class='y1'>y"+utils.sub1+"</tspan>.")
            bind("m12", "How much <tspan class='x2'>x"+utils.sub2+"</tspan> affects <tspan class='y1'>y"+utils.sub1+"</tspan>.")
            bind("m13", "How much <tspan class='x3'>x"+utils.sub3+"</tspan> affects <tspan class='y1'>y"+utils.sub1+"</tspan>.")

            bind("m21", "How much <tspan class='x1'>x"+utils.sub1+"</tspan> affects <tspan class='y2'>y"+utils.sub2+"</tspan>.")
            bind("m22", "How much <tspan class='x2'>x"+utils.sub2+"</tspan> affects <tspan class='y2'>y"+utils.sub2+"</tspan>.")
            bind("m23", "How much <tspan class='x3'>x"+utils.sub3+"</tspan> affects <tspan class='y2'>y"+utils.sub2+"</tspan>.")

            bind("m31", "How much <tspan class='x1'>x"+utils.sub1+"</tspan> affects <tspan class='y3'>y"+utils.sub3+"</tspan>.")
            bind("m32", "How much <tspan class='x2'>x"+utils.sub2+"</tspan> affects <tspan class='y3'>y"+utils.sub3+"</tspan>.")
            bind("m33", "How much <tspan class='x3'>x"+utils.sub3+"</tspan> affects <tspan class='y3'>y"+utils.sub3+"</tspan>.")

            var nothing4Vectors =  "Does nothing for <tspan class='vector'>vectors</tspan>."
            bind("m14", function(){ return point ? "A constant added to <tspan class='y1'>y"+utils.sub1+"</tspan>." : nothing4Vectors})
            bind("m24", function(){ return point ? "A constant added to <tspan class='y2'>y"+utils.sub2+"</tspan>." : nothing4Vectors})
            bind("m34", function(){ return point ? "A constant added to <tspan class='y3'>y"+utils.sub3+"</tspan>." : nothing4Vectors})

            bind("x1", "The first input.")
            bind("x2", "The second input.")
            bind("x3", "The third input.")
            bind("y1", "The first output.")
            bind("y2", "The second output.")
            bind("y3", "The third output.")

            //TODO make this update when the component is clicked
            //Also it relies on it being a point not a vector on start
            bind("point", function(){ return point ? pointStory : vectorStory })
        }
    }

    return function(){render(true);}
}
