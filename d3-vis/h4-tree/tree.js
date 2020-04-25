const data = "../d3-vis/h4-tree/data.csv";
const diameter = 500;
const pad = 14;
const height = 1000;
const width = 960;
const r = 5;
const radialLine = d3.linkRadial()
    .angle(d => d.theta + Math.PI / 2) // rotate, 0 angle is mapped differently here
    .radius(d => d.radial);
const numberFormat = d3.format(".2~s");



d3.csv(data).then(function(flatData) {
    let processed = flatData.map(function(row) {
        return {
            name : row.call,
            parent: row.group,
            count: row.count 
        }
    })

    let groups = new Set(processed.map(row => row.parent))

    groups.forEach(group => {
        processed.push( 
            {
                name: group,
                parent: "District 1",
                count: 0
            })
    });    

    processed.push(
        {name: "District 1",
            parent: "",
        count:0}
    )


    let root = d3.stratify()
        .id(function(row) { return row.name; })
        .parentId(function(row) {return row.parent;})
    (processed);

    root.count();

    root.each(function(node) {
    // copy this calculation since value is sometimes overwritten
        node.data.leaves = node.value;
    })
  
    root.sum(row => row.count)
  
    root.each(function(node) {
        // copy this calculation since value is sometimes overwritten
        node.data.total = node.value;
    })

    let data = root;

    data.sort(function(a, b) { 
        return b.height - a.height || b.count - a.count; 
    });
    
    color = d3.scaleSequential([root.height, 0], d3.interpolateViridis)

    let layout = d3.cluster().size([2 * Math.PI, (diameter / 2) - pad]);
    
    layout(data);
    
    data.each(function(node) {
        node.theta = node.x;
        node.radial = node.y;
        
        var point = toCartesian(node.radial, node.theta);
        node.x = point.x;
        node.y = point.y;
    });
    
    let svg = d3.select("#vis")
        .style("width", width)
        .style("height", height);
    
    let plot = svg.append("g")
        .attr("id", "plot")
        .attr("transform", `translate(${width/ 4}, ${height - height/4})`);
    
    drawNodes(plot.append("g"), data.descendants(), true);
    drawLinks(plot.append("g"), data.links(), radialLine);

      // make sure value is set
    data.sum(d => d.count)

    layout = d3.pack()
        .padding(r)
        .size([diameter - 2 * pad, diameter - 2 * pad]);

    layout(data);

    plot = svg.append("g")
        .attr("id", "plot2")

    drawNodes(plot.append("g"), data.descendants(), false);

    return svg.node();
});

function toCartesian(r, theta) {
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  };
}

function drawLinks(g, links, generator) {

  let paths = g.selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('d', generator)
    .attr('class', 'link');
}

function drawNodes(g, nodes, raise) {
  let circles = g.selectAll('circle')
    .data(nodes, node => node.data.name)
    .enter()
    .append('circle')
      .attr('r', d => d.r ? d.r : r)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('id', d => d.data.name.split(' ').join('_') + "_" + d.data.parent.split(' ').join('_'))
      .attr('class', 'node')
      .style('fill', d => color(d.depth));
  
  setupEvents(g, circles, raise, raise);
}

function setupEvents(g, selection, raise, interactivity) {

  selection.on('mouseover.highlight', function(d) {

    // https://github.com/d3/d3-hierarchy#node_path
    // returns path from d3.select(this) node to selection.data()[0] root node

    let path = d3.select(this).datum().path(selection.data()[0]);
    // console.log("To be update")
    // console.log(path)

    // select all of the nodes on the shortest path
    let update = selection.data(path, node => node.data.total);

    // if(interactivity) {
        let gPlot = d3.select('svg#vis');

        gPlot.selectAll(".node")
            .transition()
            .style("opacity", "0.3")

        path.forEach(d => {
            let selector = "circle#" + d.data.name.split(' ').join('_') + "_" + d.data.parent.split(' ').join('_') + ".node";
            let depth = d.depth;


            gPlot.selectAll(selector)
                .transition()
                .style("opacity", "1")
            })
    // }

            // highlight the selected nodes
    update.classed('selected', true);
        
        if (raise) {
        update.raise();
        }

    });
  
    selection.on('mouseout.highlight', function(d) {
        let path = d3.select(this).datum().path(selection.data()[0]);

        let update = selection.data(path, node => node.data.total);
    
        update.classed('selected', false);

        d3.selectAll(".node")
            .transition()
            .style("opacity", "1")

        
    });
    
    // show tooltip text on mouseover (hover)
    selection.on('mouseover.tooltip', function(d) {
        showTooltip(g, d3.select(this));
    });
    
    // remove tooltip text on mouseout
    selection.on('mouseout.tooltip', function(d) {
        g.select("#tooltip").remove();
  }); 
}


function showTooltip(g, node) {

    
    let gbox = g.node().getBBox();     // get bounding box of group BEFORE adding text
    let nbox = node.node().getBBox();  // get bounding box of node
    
    // calculate shift amount
    let dx = nbox.width / 2;
    let dy = nbox.height / 2;

    // retrieve node attributes (calculate middle point)
    let x = nbox.x + dx;
    let y = nbox.y + dy;

    // get data for node
    let datum = node.datum();
    

    let text;

    if(datum.data.leaves == 1)
        text = `${datum.data.name} (${numberFormat(datum.data.total)})`;
    // use node name and total size as tooltip text
    else 
        text = `${datum.data.name} (${numberFormat(datum.data.total)}, ${numberFormat(datum.data.leaves)}n)`;
    
    // create tooltip
    let tooltip = g.append('text')
        .text(text)
        .attr('x', x)
        .attr('y', y)
        .attr('dy', -dy - 4) // shift upward above circle
        .attr('text-anchor', 'middle') // anchor in the middle
        .attr('id', 'tooltip');

    // it is possible the tooltip will fall off the edge of the
    // plot area. we can detect when this happens, and set the
    // text anchor appropriately

    // get bounding box for the text
    let tbox = tooltip.node().getBBox();

    // if text will fall off left side, anchor at start
    if (tbox.x < gbox.x) {
        tooltip.attr('text-anchor', 'start');
        tooltip.attr('dx', -dx); // nudge text over from center
    }
    // if text will fall off right side, anchor at end
    else if ((tbox.x + tbox.width) > (gbox.x + gbox.width)) {
        tooltip.attr('text-anchor', 'end');
        tooltip.attr('dx', dx);
    }

    // if text will fall off top side, place below circle instead
    if (tbox.y < gbox.y) {
        tooltip.attr('dy', dy + tbox.height);
    }
    }
