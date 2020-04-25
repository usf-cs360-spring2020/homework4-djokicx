d3.csv("../d3-vis/h1-heatmap/airlines.csv").then(function(result) {
    // CSV must include headers
    // headers used as keys
    let map = new Map();
    
    result.forEach(element => {
        // if(element.category == "Low Fare") {
        

        // if airline not in the map, add it
        if(!map.has(element.airline)) {
            map.set(element.airline, new Map());
        }

        let year = element.period.substring(0, 4);

        // check if count exists for that year
        if(!map.get(element.airline).has(year)) {
            map.get(element.airline).set(year, 0);
        }


        map.get(element.airline).set(year, map.get(element.airline).get(year) + +element.count);
    // }
    });

    let entries = [];

    for(let airline of map) {
        if(airline[1].size != 10) {
            map.delete(airline[0]);
            continue;
        }

        let sum = 0;

        for(let entry of airline[1]) {
            if(entry[1] > 1.0e+6) {
                map.delete(airline[0]);
                break;
            };
        }


        if(!map.has(airline[0])) {
            continue;
        }

        for(let entry of airline[1]) {
            entries.push(
                {
                    'airline':airline[0],
                    'year': entry[0],
                    'count': entry[1]
                }
            )
        }
    }
        return {
            'entries': entries, 
            'airlines': Array.from(map.keys()).sort(), 
        };
    }).then(function(input) {
    
    
    const data = input.entries;
    const keys = input.airlines;
    const counts = input.entries.map(e => + e.count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);

    const margin = 60;
    const width = 950 - 6 * margin;
    const height = 950 - 2 * margin;
    const yValues = keys;
    const xValues = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018];

    const svg = d3.select('svg#heatmap');

    const chart = svg.append('g')
        .attr('transform', `translate(${margin * 2.5}, ${margin/2})`);

    // y scales year
    var yScale = d3.scaleBand()
        .range([0, height])
        .domain(yValues)

    // x scales airline
    var xScale = d3.scaleBand()
        .range([0, width])
        .domain(xValues)
        .padding(0.01)

    var yAxis = d3.axisLeft(yScale).tickPadding(0);


    chart.append('g')
        .attr("id", "x-axis")
        .attr("class", "axis")
        .call(yAxis)

    var xAxis = d3.axisBottom(xScale).tickPadding(0);
    
    chart.append('g')
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
            .selectAll("text")  
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

    var legend = svg.append("defs")
        .append("svg:linearGradient")
        .attr('transform', `translate(${width}, ${margin/4 + 10})`)
        .attr("id", "gradient")

    var colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([min, max])    
    
    legend.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(min))
        .attr("stop-opacity", 1);

    legend.append("stop")
        .attr("offset", "33%")
        .attr("stop-color", colorScale(min + Math.abs((max-min) * 0.33)))
        .attr("stop-opacity", 1);

    legend.append("stop")
        .attr("offset", "66%")
        .attr("stop-color", colorScale(min + Math.abs((max-min) * 0.66)))
        .attr("stop-opacity", 1);

    legend.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(max))
        .attr("stop-opacity", 1);

    var y = d3.scaleLinear()
        .range([height / 4 - 1, 0])
        .domain([min, max])
        // .nice(2);

    
    svg.append('g')
        .attr('transform', `translate(${width + margin * 3 + margin/ 4}, ${height / 1.6 - height / 4})`)
        .call(d3.axisRight(y).ticks(6));

    svg.append("rect")
        .attr("width", height / 4)
        .attr("height", margin/ 4)
        .style("fill", "url(#gradient)")
        .attr('transform', `translate(${width + margin * 3}, ${height / 1.6})rotate(-90)`)

    svg.append('text')
        .attr('x', (-(height/2) - margin/2))
        .attr('y', margin/2.5)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Airline')


    svg.append('text')
        .attr('x', width/2 + margin * 2.5)
        .attr('y', height + margin + margin/1.5)
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Year')

    chart.selectAll()
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(d.year))
        .attr('y', (d) => yScale(d.airline))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => height/yValues.length - 0.1)
        .attr('fill', (d) => colorScale(d.count))
    

});




    function arrayToCSV(objArray) {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

        return array.reduce((str, next) => {
            str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
            return str;
            }, str);
    }

    
