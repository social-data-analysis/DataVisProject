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
        .attr("r", 2.5)
        .attr("class", "non_brushed")
        .style("fill", function(d, i) {
          return "#f4fc83"
        })
        .style("z-index", 3)
        .style("position", "absolute")
    })
})

changeYear('2005-2018');
//
d3.select('#decades').on("change", function () {
  var sect = document.getElementById("decades");
	var section = sect.options[sect.selectedIndex].value;
  changeYear(section);
});


var datasource;
var backUp=null;

function changeYear(year){
  displayDots(year)
}

function displayDots(year){
  var from = year.substr(0,year.indexOf('-'));
  var to = year.substr(year.indexOf('-')+1,year.length);

  // svg.remove()
  d3.csv('filmLocationsInSF.csv', function(data) {
    data = data.filter((d)=>{
      return (d.Release_Year >= from && d.Release_Year <= to);
    });

    var width = 800, height = 600;
    var fill = d3.scale.ordinal().range(['#f4fc83','#54daf2'])

    var svg = d3.select(".chart").append("svg")
       .attr("width", width)
       .attr("height", height);

   for (var j = 0; j < data.length; j++) {
     data[j].radius =+ 3;
     data[j].x = Math.random() * width;
     data[j].y = Math.random() * height;
   }

   var padding = 2;
   var maxRadius = d3.max(_.pluck(data, 'radius'));

   var getCenters = function (vname, size) {
     var centers, map;
     centers = _.uniq(_.pluck(data, vname)).map(function (d) {
       return {name: d, value: 1};
     });
     map = d3.layout.treemap().size([width, height / 2]);
     map.nodes({children: centers});
     return centers;
   };

   if (nodes) {
     nodes.exit().remove();
   }
   var nodes = svg.selectAll("circle")
        .data(data);

      nodes.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("r", function (d) { return d.radius; })
        .style("fill", function (d) { return fill(d.Director); })

      var force = d3.layout.force();

      draw('Production_Company');

      $( ".btn" ).click(function() {
        draw(this.id);
      });

      function draw (varname) {
        var centers = getCenters(varname, [400, 400]);
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
