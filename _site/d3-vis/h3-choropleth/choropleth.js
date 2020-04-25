const svg = d3.select("body").select("svg#vis");

const g = {
  basemap: svg.select("g#basemap"),
  outline: svg.select("g#outline"),
  tooltip: svg.select("g#tooltip"),
  details: svg.select("g#details")
};

// setup tooltip (shows neighborhood name)
const tip = g.tooltip.append("text").attr("id", "tooltip");
tip.attr("text-anchor", "end");
tip.attr("dx", -5);
tip.attr("dy", -5);
tip.style("visibility", "hidden");

// add details widget
// https://bl.ocks.org/mbostock/1424037
const details = g.details.append("foreignObject")
  .attr("id", "details")
  .attr("width", 960)
  .attr("height", 600)
  .attr("x", 0)
  .attr("y", 0);

const body = details.append("xhtml:body")
  .style("text-align", "left")
  .style("background", "none")
  .html("<p>Graffiti Incidents</p>");

var color = d3.scaleThreshold()
  .domain([150, 250, 400, 700, 900, 1200])
  .range(d3.schemeBlues[7]);
details.style("visibility", "hidden");

// setup projection
// https://github.com/d3/d3-geo#geoConicEqualArea
const projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);

// setup path generator (note it is a GEO path, not a normal path)
const path = d3.geoPath().projection(projection);

// var g = d3.select("g").call(x);


var data = d3.map();

var promises = [
  d3.json("../d3-vis/h3-choropleth/districts.geojson"),
  d3.csv("../d3-vis/h3-choropleth/cases.csv", function(d) { data.set(d.neighborhood, +d.count); })
]

Promise.all(promises).then(ready)

function ready([neighborhoods]) {
    projection.fitSize([960, 600], neighborhoods);
    // console.log(neighborhoods)
    drawBasemap(neighborhoods);
}

function drawBasemap(json) {
//   console.log("basemap", json);

  const basemap = g.basemap.selectAll("path.land")
    .data(json.features)
    .enter()
    .append("path")
    .attr("fill", function(d) {
        // console.log("color: " + color(data.get(d.properties.district)))
        return color(data.get(d.properties.district)); })
    .attr("d", path)
    .attr("class", "land");

  const outline = g.outline.selectAll("path.neighborhood")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "neighborhood")
      .each(function(d) {
        // save selection in data for interactivity
        // saves search time finding the right outline later
        d.properties.outline = this;
      });

  // add highlight
  basemap.on("mouseover.highlight", function(d) {
    let value = data.get(d.properties.district);

    const html = ` <table border="0" cellspacing="0" cellpadding="2">
    <h1>Graffiti Incidents</h1>
      <tbody>
        <tr>
          <th>Count:</th>
          <td>${value}</td>
        </tr>
        <tr>
          <th>District:</th>
          <td>${d.properties.district}</td>
        </tr>
      </tbody>
      </table>`

    body.html(html);

    details.style("visibility", "visible");
    d3.select(d.properties.outline).raise();
    d3.select(d.properties.outline).classed("active", true);
  })
  .on("mouseout.highlight", function(d) {
    details.style("visibility", "hidden");
    d3.select(d.properties.outline).classed("active", false);
  });

  // add tooltip
  basemap.on("mouseover.tooltip", function(d) {
    
    tip.text(d.properties.district);
    tip.style("visibility", "visible");
  })
  .on("mousemove.tooltip", function(d) {
    const coords = d3.mouse(g.basemap.node());
    tip.attr("x", coords[0]);
    tip.attr("y", coords[1]);
  })
  .on("mouseout.tooltip", function(d) {
    tip.style("visibility", "hidden");
  });
}

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}