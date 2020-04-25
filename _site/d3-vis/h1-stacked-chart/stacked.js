Promise.all([
    d3.csv("../d3-vis/h1-stacked-chart/data.csv"),
    d3.csv("../d3-vis/h1-stacked-chart/airline-set.csv"),
]).then(function(files) {
    // set of allowed airlines, concluded from the previous visualization
    let airlines = new Set();

    files[1].forEach(e => {
        airlines.add(e.airline);   
    });

    let map = new Map();

    files[0].forEach(e => {
        if(airlines.has(e.airline)) {

        let year = e.period.substring(0, 4);

        // if year not in map, add it
        if(!map.has(year)) {
            map.set(year, new Map());
        }

        // if year's map does not have activity, add it with count 0
        if(!map.get(year).has(e.activity)) {
            map.get(year).set(e.activity, 0);
          }

          map.get(year).set(e.activity, map.get(year).get(e.activity) + +e.count)
        }
        
    });

    let entries = [];

    for(let elem of map) {
        let entry = {};
        entry.year = elem[0];
        for(let activity of elem[1]) {
            if(activity[0] == "Transit") continue;
            entry[activity[0].toLowerCase()] = activity[1];
        }
        entries.push(entry);
    }

    entries.sort((a, b) => (a.year > b.year) ? 1 : -1);

    return entries;
}).then(function(data) {
    data.pop();
    let margin = {top: 10, right: 30, bottom: 50, left: 50};
    let width = 750 - margin.left - margin.right;
    let height = 400 - margin.top - margin.bottom;

    // selection method accepts all kind of selector strings and returns the first matching element
    var svg = d3.select("svg#stacked")
        .append("g")
        .attr("transform",
              "translate(" + margin.left * 1.5 + "," + margin.top * 1.5 + ")");;

    const chart = svg.append('g');

    let xScale = d3.scaleBand()
        .domain(data.map(function(d) { return d.year}))
        .range([0, width])
        .padding(0.1);



    let yScale = d3.scaleLinear()
        .domain([0, 8000000])
        .range([height, 0]);



    svg.append('text')
        .attr('x', (-(height/2) - margin.top/2))
        .attr('y', -(margin.left))
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Count (Millions)')


    svg.append('text')
        .attr('x', width/2)
        .attr('y', height + margin.bottom / 1.5)
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Year')

    chart.append('g').call(d3.axisLeft(yScale).ticks(20, "s"));
    chart.append('g').attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    let activity = ["enplaned", "deplaned"];
// color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(activity)
        .range(['#4d78a7', '#f28e2c'])

    var stackedData = d3.stack()
        .keys(activity)
        (data)


    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
          .attr("fill", function(d) { return color(d.key); })
          .selectAll("rect")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("x", function(d) { return xScale(d.data.year); })
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
            .attr("width",xScale.bandwidth())
    

      chart.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft()
        .scale(yScale)
        .tickSize(-width, 0, 0)
        .tickFormat(''))

    var keys = ["Enplaned", "Deplaned"];

// Add one dot in the legend for each name.
svg.selectAll("mydots")
  .data(keys)
  .enter()
  .append("rect")
    .attr("x", width + 25)
    .attr("y", function(d,i){ return 10 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d){ return color(d)})

// Add one dot in the legend for each name.
svg.selectAll("mylabels")
  .data(keys)
  .enter()
  .append("text")
    .attr("x", width + 40)
    .attr("y", function(d,i){ return 15 + i*25})
    .style("fill", function(d){ return color(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")


    
function arrayToCSV(objArray) {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

        return array.reduce((str, next) => {
            str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
            return str;
            }, str);
    }
    
}).catch(function(err) {
    // handle error here
})

        
