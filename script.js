//----------------------------------------------------------------------------------------------------------------------
// HISTOGRAM
//----------------------------------------------------------------------------------------------------------------------

// Define SVG dimensions.
var histogramWidth = 600,
    histogramHeight = 200;

var padding = 40;

var parseDate = d3v4.timeParse("%Y");
var formatDate = d3v4.timeFormat("%Y");

var minDate = 2006,
    maxDate = 2016;

var tickValues = d3v4.range(12);

var colors = ["#8C5B79", "#777DA3", "#49A1B4", "#41BFA4", "#88D57F", "#E2E062"]; 

// Create SVG element
var svgHistogram = d3v4.select(".histogram").append("svg")
  .attr("width", histogramWidth)
  .attr("height", histogramHeight);

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

function getYear(startYear, endYear) {
  var yearArray = new Array();
  var currentYear = startYear;
  while (currentYear <= endYear) {
    yearArray.push(currentYear);
    currentYear++;
  }
  return yearArray;
}

var nestedData; 

d3v3.csv("./Film_Locations_in_San_Francisco_with_coordinates_many.csv", function(data) {
  
  var allYears = getYear(1915, 2018); // get all years between 1924-2018
    
  nestedData = d3v3.nest()
    .key(function(d) {
      return d['Release Year']
    })
    .entries(data);

    console.log(nestedData);
    
    var nestedDataDates = nestedData.map(function (item) {
      return item.key;
    })
    
    // Add the years that are missing from the dataset and set their filming locations
    allYears.map(function(year) {
      if (!nestedDataDates.includes(year)) {
        nestedData.push({
        key: year,
        values: []
      })
    }});
  
  createBins(nestedData);
});

function createBins(data) {

  // Count up filming locations each year
  var processedData = [];

  data.map(function (item) {
    processedData.push({
      day: item.key,
      locationsCount: item.values.length 
    })
  })
  
  createBarPlot(processedData);
}

function createBarPlot(data) {
   
  // Get max value for y scale
  var maxHRange = Math.max.apply(Math, data.map(function(d) { return d.locationsCount; }))
  
  // Set the ranges
  xScale = d3v4.scaleTime()
    .domain([new Date(1924, 0, 1), new Date(2018, 0, 1)])
    .rangeRound([padding, histogramWidth - padding]);

  xAxis = d3v4.axisBottom()
    .scale(xScale);

  yScale = d3v4.scaleLinear()
    .domain([0, maxHRange])
    .range([histogramHeight - padding, padding]);

var tickArray = [];
for(var i = 0; i <= 290; i+=50)
  tickArray.push(i);

  yAxis = d3v4.axisLeft()
    .scale(yScale)
    .tickValues(tickArray)

  createRectangles(data);
}

function createRectangles(data) { 
  svgHistogram.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return xScale(parseDate(d.day));
    })
    .attr("y", function(d) {
      return yScale(d.locationsCount);
    })
    .attr("width", 4)
    .attr("height", function(d) {
      return histogramHeight - padding - yScale(d.locationsCount);
    })
    .attr('fill', colors[2]);

  svgHistogram.append("g")
    .attr("class", "axisX")
    .attr("transform", "translate(0," + (histogramHeight - padding) + ")")
    .call(xAxis);

  svgHistogram.append("g")
    .attr("class", "axisY")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

  svgHistogram.append("text")
    .attr("transform", "translate(" + (histogramWidth / 2) + "," + (histogramHeight - 2) + ")")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#eaeaea")
    .text("Year");

  svgHistogram.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", 0 - (histogramHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("fill", "#eaeaea")
    .style("font-size", "14px")
    .text("Nr of filming locations");

  // Add brush
  svgHistogram.append("g")
    .attr("class", "brush")
    .call(d3v4.brushX()
      .extent([[padding, padding], [histogramWidth - padding, histogramHeight - padding]])
      .on("start brush", brushed));
  }

function filterData(startDate, endDate) {
  var startYear = formatDate(startDate);
  var endYear = formatDate(endDate);
  var remainingYears = [];
  for (var i = parseInt(startYear); i <= endYear; i++) 
    remainingYears.push(i);
  return nestedData.filter(function (d) {
    if (d.values.length > 0)
      return remainingYears.includes(parseInt(d.key));
  })
}

//----------------------------------------------------------------------------------------------------------------------
// SF MAP
//-----------------------------------------------------------------------------------------------------------------------

var width = 600,
    height = 600,
    centered;

var map = d3v3.select("body").select(".map").append("svg")
  .attr("width", width)
  .attr("height", height);

var tooltip = d3v3.select('body').append('div')
  .attr('class', 'hidden tooltip');

var g = map.append("g");

var projection = d3v3.geo.mercator().scale(1).translate([0, 0]).precision(0);
var path = d3v3.geo.path().projection(projection);

d3v3.json("districtsOfSF.json", function(json) {
  var bounds = path.bounds(json);

  xScaleMap = width / Math.abs(bounds[1][0] - bounds[0][0]);
  yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
  scale = xScaleMap < yScale ? xScaleMap : yScale;

  var transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
  projection.scale(scale).translate(transl);

  g.append("g")
  .selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function(d, i) {
        return "#1b222d"
      })
      .style("stroke", function(d, i) {
        return "#313a47"
      })
      .style("position", "relative")
      .style("z-index", 1)
      .on("mouseover", function(d) {
       d3v3.select(this)
         .transition()
         .duration(50)
         .style("fill", "#091526");
       })
       .on("mouseout", function(d) {
         tooltip.classed('hidden', true);
         d3v3.select(this)
           .transition()
           .duration(50)
           .style("fill", "#1b222d")
       })
       .on("mousemove", function(d) {
         var mouse = d3v3.mouse(map.node()).map(function(d) {
             return parseInt(d);
         });
         if (d.properties.name) {
           tooltip.classed('hidden', false)
             .attr('style', 'left:' + (mouse[0] + 640) + 'px; top:' + (mouse[1] + 20) + 'px')
             .html("<p class=\"centerTip\">" + d.properties.name + "</p>");
         };
       })
       .on("click", clicked);


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

   var categorical = [
     { "name" : "schemeAccent", "n": 8},
     { "name" : "schemeDark2", "n": 8},
     { "name" : "schemePastel2", "n": 8},
     { "name" : "schemeSet2", "n": 8},
     { "name" : "schemeSet1", "n": 9},
     { "name" : "schemePastel1", "n": 9},
     { "name" : "schemeCategory10", "n" : 10},
     { "name" : "schemeSet3", "n" : 12 },
     { "name" : "schemePaired", "n": 12},
     { "name" : "schemeCategory20", "n" : 20 },
     { "name" : "schemeCategory20b", "n" : 20},
     { "name" : "schemeCategory20c", "n" : 20 }
   ]

    d3v3.csv("./Film_Locations_in_San_Francisco_with_coordinates_many.csv", function(data) {

      var width = 1200, height = 1000;
      var fill = d3v3.scale.ordinal().range(['#f4fc83','#54daf2'])

      var svg = d3v3.select(".chart").append("svg")
         .attr("width", width)
         .attr("height", height);

     for (var j = 0; j < data.length; j++) {
       data[j].radius =+ 3;
       data[j].x = Math.random() * width;
       data[j].y = Math.random() * height;
     }

     var padding = 2;
     var maxRadius = d3v3.max(_.pluck(data, 'radius'));

     var getCenters = function (vname, size) {
       var centers, map;
       centers = _.uniq(_.pluck(data, vname)).map(function (d) {
         return {name: d, value: 1};
       });
      //  console.log(centers)
       map = d3v3.layout.treemap().size([width, height]);
       map.nodes({children: centers});
       return centers;
     };

     var nodes = svg.selectAll("circle")
          .data(data);

        nodes.enter().append("circle")
          .attr("class", "node")
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; })
          .attr("r", function (d) { return d.radius; })
          .style("fill", function (d) { return fill(d.Director); })

        var force = d3v3.layout.force();

        draw('Production_Company');

        $( ".btn" ).click(function() {
          draw(this.id);
        });

        function draw (varname) {
          var centers = getCenters(varname, [800, 800]);
          force.on("tick", tick(centers, varname));
          labels(centers)
          force.start();
        }

        function tick (centers, varname) {
          var foci = {};
          for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
          }
          return function (e) {
            for (var i = 0; i < data.length; i++) {
              var o = data[i];
              var f = foci[o[varname]];
              o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
              o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
            }
            nodes.each(collide(.11))
              .attr("cx", function (d) { return d.x; })
              .attr("cy", function (d) { return d.y; });
          }
        }

        function labels (centers) {
          svg.selectAll(".label").remove();

          svg.selectAll(".label")
          .data(centers).enter().append("text")
          .attr("class", "label")
          .text(function (d) { return d.name })
          .attr("transform", function (d) {
            return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 20) + ")";
          });
        }


        function collide(alpha) {
          var quadtree = d3v3.geom.quadtree(data);
          return function (d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
              if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y)
                    r = d.radius + quad.point.radius + padding;
                if (l < r) {
                  l = (l - r) / l * alpha;
                  d.x -= x *= l;
                  d.y -= y *= l;
                  quad.point.x += x;
                  quad.point.y += y;
                }
              }
              return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
          };
        }


      g.selectAll("circle")
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
        .attr("r", 2.5)
        .attr("class", "non_brushed")
        .style("fill", function(d, i) {
          return "#f4fc83"
        })
        .style("z-index", 3)
        .style("position", "absolute")
    })
})


function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}


function drawFilmingLocations(data) {
  var filmingLocations = data.map(function(item) {
    if (item.values.length > 0) return item.values;
  });

  // Flatten array
  filmingLocations = [].concat.apply([], filmingLocations);

  console.log(filmingLocations);

  map.selectAll("circle")
    .data(filmingLocations)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      if (d && d.Coordinates) {
        var coords = d.Coordinates.split(" ");
        return projection([coords[1], coords[0]])[0];
      }
    })
    .attr("cy", function(d) {
      if (d && d.Coordinates) {
        var coords = d.Coordinates.split(" ");
        return projection([coords[1], coords[0]])[1];
      }
    })
    .attr("r", 2)
    .attr("class", "brushed")
    .style("z-index", 3)
    .style("position", "absolute")
}

//----------------------------------------------------------------------------------------------------------------------
// BRUSHING
//----------------------------------------------------------------------------------------------------------------------

function brushed() {
  if (d3v4.event.sourceEvent.type === "brush") return;
  if (d3v4.event.selection) {
    var d0 = d3v4.event.selection.map(xScale.invert),
    d1 = d0.map(Math.round);
    
    // If empty when rounded, use floor instead.
    if (d1[0] >= d1[1]) {
      d1[0] = Math.floor(d0[0]);
      d1[1] = d1[0] + 1;
    }
    
    d3v4.select(this).call(d3v4.event.target.move, d1.map(xScale));

    updateFilmingLocations(d0[0], d0[1]);
  }
}

function updateFilmingLocations(startDate, endDate) {
  var filteredData = filterData(startDate, endDate);

  map.selectAll("circle")
    .remove();

  drawFilmingLocations(filteredData);
}