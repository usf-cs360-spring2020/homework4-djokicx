// set the dimensions and margins of the graph
var margin = {top: 30, right: 150, bottom: 10, left: 50},
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#parallel")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

let tierNames = ["Ivy Plus", "Other elite schools (public and private)", "Highly selective public", "Highly selective private", "Selective public", "Selective private"];


d3.csv("../d3-vis/h2-parallel/mrc_table2-f.csv").then(function(data) {  
    var color = d3.scaleOrdinal()
        .domain(tierNames.reverse())
        .range(["#4778a2", "#fa8d3f", "#ea585d", "#4d9f55", "#b3789f", "#9f7460"]);
    

    let dimensions = ["tier", "par_median", "k_median", "mr_kq5_pq1", "mr_ktop1_pq1"]
    let dimensionsDisplay = ["Tier", "Mean Parental Income", "Mean Kid Earnings", "Mobility Rate", "Upper-Tail Mobility Rate"]
    

    // Build linear scale for each dimension with min/max value domain
    var y = {}
    for (i in dimensions) {
        name = dimensions[i];

        let max = d3.max(data.map(d => Number(d[name])));
        let min = d3.min(data.map(d => Number(d[name])));

        let domain = name == 'tier' ? [min, max] : [max, min];
        
        y[name] = d3.scaleLinear()
            .domain(domain)
            .range([height, 0])
    }

    x = d3.scalePoint()
        .range([0, width])
        .domain(dimensions);
    
    // Highlight the hovered colleges
    var highlight = function(d){
        let tier = d.tier

        d3.selectAll(".line")
            .transition()
            .style("stroke", "lightgrey")
            .style("opacity", "0.3")

        d3.selectAll("#l" + tier)
            .transition()
            .style("stroke", color(tier.toString()))
            .style("opacity", "1")
    }
    
    // Undo Higlight
    var undoHighlight = function(d){
        d3.selectAll(".line")
        .transition().delay(150)
        .style("stroke", function(d){ return( color(d.tier))} )
        .style("opacity", "1")
    }
    
    // Define path for each row
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }
    
    // Draw the lines
    svg.selectAll("myPath")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line" ) 
        .attr("id", function (d) { return "l" + d.tier } )
        .attr("d",  path)
        .style("fill", "none" )
        .style("stroke", function(d){ return( color(d.tier))} )
        .style("opacity", 0.7)
        .on("mouseover", highlight)
        .on("mouseleave", undoHighlight )
    
    // Draw the axes
    svg.selectAll("myAxis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(6).scale(y[d])); })
        // Title from the different array
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return dimensionsDisplay[dimensions.findIndex(e => e == d)] })
        .style("fill", "black")

    // Legend

    svg.append("text")
        .attr("x", width + 35)
        .attr("y", height / 2 - margin.top - 100)
        .text("Tier")
        .attr("class", "legend-title")
        

    svg.selectAll("rect")
        .data(tierNames)
        .enter()
        .append("rect")
            .attr("x", width + 8)
            .attr("y", function(d,i){ return height / 2 - margin.top - 90 + i * 25})
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d){ return color(d.toString())})

    svg.selectAll("mylabels")
        .data(tierNames)
        .enter()
        .append("text")
            .attr("x", width + 19)
            .attr("y", function(d,i){ return height / 2 - margin.top - 84 + i*25}) 
            .style("fill", "darkgrey")
            .text(function(d){ return d})
            .attr("text-anchor", "right")
            .style("alignment-baseline", "middle")
            .attr("class", "legend-names")

    })