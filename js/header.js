var svg = d3.select("svg.header")
    .append("g")
    .translate((window.innerWidth-620)/2, 120)

var radius = d3.scale.linear()
    .domain([0, 5])
    .range([50, 10])

var theta = function(d){
    switch(d){
        case 0: return 102;
        case 1: return 173;
        case 2: return 232;
        case 3: return 278;
        case 4: return 315;
        case 5: return 340;
    }
}

svg.selectAll("circle")
    .data(d3.range(6))
    .enter()
    .append("circle")
    .attr("r", radius)
    .attr("transform", function(d){ return "translate(90, 0) rotate("+theta(d)+",-90,0)"})
    .attr("class", function(d){ return ["x", "y"][Math.floor(d/3)]+((d%3)+1) })


svg = d3.select("svg.footer")
    .append("g")
    .translate(620/2, 10)

var x = d3.scale.linear()
        .domain([0, 5])
        .range([-50, 50])

svg.selectAll("circle")
    .data(d3.range(6))
    .enter()
    .append("circle")
    .attr("r", 7)
    .translate(function(d){ return [x(d), 0] })
    .attr("class", function(d){ return ["x", "y"][Math.floor(d/3)]+((d%3)+1) })
