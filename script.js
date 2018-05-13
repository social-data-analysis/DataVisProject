//----------------------------------------------------------------------------------------------------------------------
// SF MAP
//-----------------------------------------------------------------------------------------------------------------------

var width = 600,
    height = 600,
    centered;

var map = d3.select("body").select(".map").append("svg")
  .attr("width", width)
  .attr("height", height);

var tooltip = d3.select('body').append('div')
  .attr('class', 'hidden tooltip');

var g = map.append("g");

var projection = d3.geo.mercator().scale(1).translate([0, 0]).precision(0);
var path = d3.geo.path().projection(projection);

d3.json("districtsOfSF.json", function(json) {
  var bounds = path.bounds(json);

  xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
  yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
  scale = xScale < yScale ? xScale : yScale;

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
       d3.select(this)
         .transition()
         .duration(50)
         .style("fill", "#091526");
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
             .attr('style', 'left:' + (mouse[0] + 390) + 'px; top:' + (mouse[1] + 150) + 'px')
             .html("<p class=\"centerTip\">" + d.properties.name + "</p>");
         };
       })
       .on("click", clicked);

    d3.csv("./filmLocationsInSF.csv", function(data) {

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
        .attr("r", 3)
        .attr("class", "non_brushed")
        .style("fill", function(d, i) {
          return "#f4fc83"
        })
        .style("z-index", 3)
        .style("position", "absolute")
    })
})

changeYear('2005-2018');

d3.select('#decades').on("change", function () {
  var sect = document.getElementById("decades");
	var section = sect.options[sect.selectedIndex].value;
  changeYear(section);
});


var datasource, from, to;
var backUp=null;

function changeYear(year){
  displayDots(year)
}

var widthBubbles = 1100, heightBubbles = 500;
var fill = d3.scale.ordinal().range(['#f4fc83'])

var svgBubbles = d3.select(".chart").append("svg")
   .attr("width", widthBubbles)
   .attr("height", heightBubbles);

function displayDots(year){
  from = year.substr(0,year.indexOf('-'));
  to = year.substr(year.indexOf('-')+1,year.length);

  d3.csv('filmLocationsInSF.csv', function(data) {
    d3.csv('location_count.csv', function(locations) {
      console.log(locations)
      data = data.filter((d)=>{
        return (d.Release_Year >= from && d.Release_Year <= to);
      });

      var aux = new Set();
      var aux2 = []

      data.map((movie, index)=>{
        if ( !aux.has(movie.Title) ){
          aux.add(movie.Title)
          aux2.push(movie)
        }
      })

     data = aux2;

     var arrayOfLocationCounts = []
     locations.forEach((location) => {
       arrayOfLocationCounts.push(parseInt(location.LocationsCount))
     })

     var x = d3.scale.linear()
      .domain([d3.min(arrayOfLocationCounts), d3.max(arrayOfLocationCounts)])
      .range([4, 15]);

    var test = {}

     for (var j = 0; j < data.length; j++) {

       locations.forEach((info, index)=>{
         if(info.Title === data[j].Title || info.Title === data[j].Title.split(",")[0] || info.Title === data[j].Title.split(" - ")[0]) {
           data[j].numberOfLocations =+ locations[index].LocationsCount;
           console.log(info.Title, data[j].Title + ' index: ' + index + ' j: ' +j + ' radius :' +data[j].radius )

           data[j].radius =+ x(locations[index].LocationsCount);
           console.log(info.Title, data[j].Title + ' index: ' + index + ' j: ' +j + ' radius :' +data[j].radius )

         }
       })

       data[j].x = Math.random() * widthBubbles;
       data[j].y = Math.random() * heightBubbles;
     }

     var padding = 5;
     var maxRadius = d3.max(_.pluck(data, 'radius'));

     var getCenters = function (vname) {
       var centers, map;
       centers = _.uniq(_.pluck(data, vname)).map(function (d) {
         return {name: d, value: 1};
       });
       map = d3.layout.treemap().size([widthBubbles, heightBubbles / 1.2]);
       map.nodes({children: centers});
       return centers;
     };

     var nodes = svgBubbles.selectAll("circle")
          .data(data);

        nodes.enter().append("circle")
          .attr("class", "node")
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; })
          .attr("id", function(d){return d.Title;})
          .on("mouseout", function(d) {
            tooltip.classed('hidden', true);
            d3.select(this)
              .transition()
              .duration(50)
              .style("fill", "#f4fc83")
          })
          .on("mousemove", function(d) {
            d3.select(this)
              .transition()
              .duration(50)
              .style("fill", "black")
            var mouse = d3.mouse(map.node()).map(function(d) {
                return parseInt(d);
            });
            if (d.Title) {
              tooltip.classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] + 380) + 'px; top:' + (mouse[1] + 250) + 'px')
                .html("<p class=\"centerTip\"> <span class=\"bold\">Title:</span> "+ d.Title + "</p>" +
                "<p class=\"centerTip\"><span class=\"bold\">Director:</span> " + d.Director + "</p>" +
                "<p class=\"centerTip\"><span class=\"bold\">Production Company:</span> " + d.Production_Company + "</p>" +
                "<p class=\"centerTip\"><span class=\"bold\">Distributor:</span> " + d.Distributor + "</p>" +
                "<p class=\"centerTip\"><span class=\"bold\">Number of locations:</span> " + d.numberOfLocations + "</p>"
              );
            };
          })
          .attr("r", function (d) { return d.radius; })
          .style("fill", function (d) { return fill(d.Director); })

        var force = d3.layout.force();

        draw('Distributor');

        var buttons = ['Distributor', 'Production_Company', 'Director']

        $( ".btn" ).click(function() {
          buttons.forEach((btn) => {
            $("#" + btn).removeClass("mybtnActive")
          })
          $("#" + this.id).addClass("mybtnActive")
          draw(this.id);
        });

        function draw (varname) {
          var centers = getCenters(varname);
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
          svgBubbles.selectAll(".label").remove();
          svgBubbles.selectAll(".label")
          .data(centers).enter().append("text")
          .attr("class", "label")
          .text(function (d) { return d.name })
          .attr("transform", function (d) {
            return "translate(" + (d.x + (d.dx / 3)) + ", " + (d.y + 20) + ")";
          });
        }

        function collide(alpha) {
          var quadtree = d3.geom.quadtree(data);
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
        nodes.exit().remove()
    })
    })

}


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

//----------------------------------------------------------------------------------------------------------------------
// SUNBURST
//----------------------------------------------------------------------------------------------------------------------

// Define parameters.
var sunburstWidth = 960,
    sunburstHeight = 700,
    sunburstRadius = (Math.min(sunburstWidth, sunburstHeight) / 2) - 10;

// Add tooltip.
var sunburstTooltip = d3.select('body').append('div')
    .attr('class', 'hidden tooltip');

// Number format.
var formatNumber = d3.format(",d");

// Define scales.
var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, sunburstRadius]);

// Define color range.
var color = d3.scale.ordinal()
    .range(d3.range(33).map(d3.scale.linear()
      .domain([0, 33 - 1])
      .range(["#f4fc83", "#54daf2"])
      .interpolate(d3.interpolateLab)));

// Partition size.
var partition = d3.layout.partition()
    .value(function(d) { return d.size; });

// Create arc.
var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

// Create new svg element.
var sunburst = d3.select("body").select(".sunburst").append("svg")
    .attr("width", sunburstWidth)
    .attr("height", sunburstHeight)
  .append("g")
    .attr("transform", "translate(" + sunburstWidth / 2 + "," + (sunburstHeight / 2) + ")");

// Read JSON.
d3.json("sunburst.json", function(error, root) {
  if (error) throw error;

  // Add paths and tooltips.
  sunburst.selectAll("path")
      .data(partition.nodes(root))
    .enter().append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .on("click", click)
      .on("mouseout", function(d) {
        sunburstTooltip.classed('hidden', true);
      })
      .on("mousemove", function(d) {
        var mouse = d3.mouse(sunburst.node()).map(function(d) {
            return parseInt(d);
        });
        if (d.name) {
          sunburstTooltip.classed('hidden', false)
            .attr('style', 'left:' + (mouse[0] + 640) + 'px; top:' + (mouse[1] + 20) + 'px')
            .html("<p class=\"centerTip\">" + d.name + "</p>");
        };
      });
});

// Zoom in when clicked.
function click(d) {
  sunburst.transition()
      .duration(750)
      .tween("scale", function() {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, sunburstRadius]);
        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
      })
    .selectAll("path")
      .attrTween("d", function(d) { return function() { return arc(d); }; });
}

d3.select(self.frameElement).style("height", sunburstHeight + "px");
