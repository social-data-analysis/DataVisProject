//----------------------------------------------------------------------------------------------------------------------
// SF MAP
//-----------------------------------------------------------------------------------------------------------------------

var width = 600,
    height = 600;

var color = d3.scaleSequential(d3.interpolateMagma)
  .domain([0, 36]);

// var color = d3.scaleLinear()
//     .domain([1, step(2), step(3), step(4), step(5), step(6), step(7), 20])
//     .range(["#8C5B79", "#777DA3", "#49A1B4", "#41BFA4", "#88D57F", "#E2E062"])
//     .interpolate(d3.interpolateHclLong); //interpolateHsl interpolateHcl interpolateRgb

var map = d3.select("body").select(".map").append("svg")
  .attr("width", width)
  .attr("height", height);

var tooltip = d3.select('body').append('div')
  .attr('class', 'hidden tooltip');

var projection = d3.geoMercator().scale(1).translate([0, 0]).precision(0);
var path = d3.geoPath().projection(projection);

d3.json("districtsOfSF.json", function(json) {
  var bounds = path.bounds(json);

  xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
  yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
  scale = xScale < yScale ? xScale : yScale;

  var transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
  projection.scale(scale).translate(transl);

  map.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function(d, i) {
        return "#1b222d"
      })
      .style("stroke", function(d, i) {
        return "#29303A"
      })
      .style("position", "relative")
      .style("z-index", 1)
      .on("mouseover", function(d) {
       d3.select(this)
         .transition()
         .duration(50)
         .style("fill", "#000000");
       })
       .on("mouseout", function(d) {
         tooltip.classed('hidden', true);
         d3.select(this)
           .transition()
           .duration(50)
           .style("fill", "#1b222d")
       })
       .on("mousemove", function(d) {
         var mouse = d3.mouse(map.node()).map(function(d) {
             return parseInt(d);
         });
         if (d.properties.name) {
           tooltip.classed('hidden', false)
             .attr('style', 'left:' + (mouse[0] + 640) + 'px; top:' + (mouse[1] + 20) + 'px')
             .html("<p class=\"centerTip\">" + d.properties.name + "</p>");
         };
       });


   // //Create one label per borough
   // map.selectAll("text")
   //  .data(json.features)
   //  .enter()
   //  .append("text")
   //  .attr("class", "label")
   //  .attr("x", function(d) {
   //    return path.centroid(d)[0] - 30;
   //  })
   //  .attr("y", function(d) {
   //    return path.centroid(d)[1];
   //  })
   //  .style("z-index", 4)
   //  .style("position", "relative")
   //  .style("font-size", 10)
   //  .text(function(d) {
   //    if (d.properties.name) {
   //      return d.properties.name;
   //    };
   //  });

    d3.csv("./filmLocationsInSF.csv", function(data) {
      map.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            var coords = d.Coordinates.split(" ");
            return projection([coords[1], coords[0]])[0];
        })
        .attr("cy", function(d) {
          var coords = d.Coordinates.split(" ");
          return projection([coords[1], coords[0]])[1];
        })
        .attr("r", 2)
        .attr("class", "non_brushed")
        .style("fill", function(d, i) {
          return "#f4fc83"
        })
        .style("z-index", 3)
        .style("position", "absolute")
    })
})
