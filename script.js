var tooltip = d3v3.select('body').append('div')
    .attr('class', 'hidden tooltip');

//First, display the latest dataset
changeYear('2005-2018');

//On choosing different timeframe from options
d3v3.select('#decades').on("change", function() {
    var sect = document.getElementById("decades");
    var section = sect.options[sect.selectedIndex].value;
    changeYear(section);
});

var datasource, from, to;
var backUp = null;

//When changing year display new dots
function changeYear(year) {
    displayDots(year)
}

var widthBubbles = 1200,
    heightBubbles = 400,
    heightLegend = 100,
    widthLegend = 500,
    dataL = 0,
    offset = 40;
var fill = d3v3.scale.ordinal().range(['#f4fc83'])

var svgBubbles = d3v3.select(".chart").append("svg")
    .attr("width", widthBubbles)
    .attr("height", heightBubbles);

var svgLegend = d3v3.select(".legend").append("svg")
    .attr("width", widthLegend)
    .attr("height", heightLegend)

var legendVals = []
//To show all possible sizes of bubbles in a graphics
for (var i = 4; i < 14; i++) {
    legendVals.push(i)
}

//Legend displaying sizes of bubbles
var legend = svgLegend.selectAll('.legend')
    .data(legendVals)
    .enter().append('circle')
    .attr("class", "legendCircle")
    .attr("r", function(d) {
        return d;
    })
    .attr("cy", 0)
    .attr("cx", 0)
    .attr("transform", function(d, i) {
        var newdataL = dataL
        dataL += offset
        return "translate(" + (newdataL + offset) + ",30)"
    })

svgLegend.append('text')
    .attr("x", 10)
    .attr("y", 35)
    .text("1")
    .style("font-family", "Nunito")
    .style("font-weight", "bold")
    .style("font-size", 14)

svgLegend.append('text')
    .attr("x", 430)
    .attr("y", 35)
    .text("122")
    .style("font-family", "Nunito")
    .style("font-weight", "bold")
    .style("font-size", 14)

function displayDots(year) {
    from = year.substr(0, year.indexOf('-'));
    to = year.substr(year.indexOf('-') + 1, year.length);

    d3v3.csv('filmLocationsInSF.csv', function(data) {
        d3v3.csv('location_count.csv', function(locations) {

            //Filter the data according to the chosen timeframe
            data = data.filter((d) => {
                return (d.Release_Year >= from && d.Release_Year <= to);
            });

            //Create set to keep only unique rows
            var aux = new Set();
            var aux2 = []

            data.map((movie, index) => {
                if (!aux.has(movie.Title)) {
                    aux.add(movie.Title)
                    aux2.push(movie)
                }
            })

            //Here is the data containing unique films to present them in bubble graphics
            data = aux2;

            var arrayOfLocationCounts = []
            locations.forEach((location) => {
                arrayOfLocationCounts.push(parseInt(location.LocationsCount))
            })

            //Map location counts into values between 4 and 15 (size of the bubbles)
            var x = d3v3.scale.linear()
                .domain([d3v3.min(arrayOfLocationCounts), d3v3.max(arrayOfLocationCounts)])
                .range([4, 13]);

            //Process the data
            for (var j = 0; j < data.length; j++) {
                locations.forEach((info, index) => {
                    if (info.Title === data[j].Title || info.Title === data[j].Title.split(",")[0] || info.Title === data[j].Title.split(" - ")[0]) {
                        data[j].numberOfLocations = +locations[index].LocationsCount;
                        data[j].radius = +x(locations[index].LocationsCount);
                    }
                })
                data[j].x = Math.random() * widthBubbles;
                data[j].y = Math.random() * heightBubbles;
            }

            var padding = 5;
            var maxRadius = d3v3.max(_.pluck(data, 'radius'));

            var getCenters = function(vname) {
                var centers, map;
                centers = _.uniq(_.pluck(data, vname)).map(function(d) {
                    return {
                        name: d,
                        value: 1
                    };
                });
                map = d3v3.layout.treemap().size([widthBubbles, heightBubbles]);
                map.nodes({
                    children: centers
                });
                return centers;
            };

            var nodes = svgBubbles.selectAll("circle")
                .data(data);

            nodes.enter().append("circle")
                .attr("class", "node")
                .attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                })
                .attr("id", function(d) {
                    return d.Title;
                })
                .on("mouseout", function(d) {
                    tooltip.classed('hidden', true);
                    d3v3.select(this)
                        .transition()
                        .duration(50)
                        .style("fill", "#f4fc83")
                })
                .on("mousemove", function(d) {
                    d3v3.select(this)
                        .transition()
                        .duration(50)
                        .style("fill", "#54daf2")
                    var mouse = d3v3.mouse(map.node()).map(function(d) {
                        return parseInt(d);
                    });
                    if (d.Title) {
                        tooltip.classed('hidden', false)
                            .attr('style', 'left:' + (mouse[0] + 610) + 'px; top:' + (mouse[1] + 210) + 'px')
                            .html("<p class=\"centerTip\"> <span class=\"bold\">Title:</span> " + d.Title + "</p>" +
                                "<p class=\"centerTip\"><span class=\"bold\">Director:</span> " + d.Director + "</p>" +
                                "<p class=\"centerTip\"><span class=\"bold\">Production Company:</span> " + d.Production_Company + "</p>" +
                                "<p class=\"centerTip\"><span class=\"bold\">Distributor:</span> " + d.Distributor + "</p>" +
                                "<p class=\"centerTip\"><span class=\"bold\">Number of locations:</span> " + d.numberOfLocations + "</p>"
                            );
                    };
                })
                .attr("r", function(d) {
                    return d.radius;
                })
                .style("fill", function(d) {
                    return fill(d.Director);
                })

            var force = d3v3.layout.force();
            var buttons = ['Distributor', 'Production_Company', 'Director']

            function makeActiveButton(which) {
                buttons.forEach((btn) => {
                    $("#" + btn).removeClass("mybtnActive")
                })
                $("#" + which).addClass("mybtnActive")
            }

            draw('Director');
            makeActiveButton('Director')

            $(".btn").click(function() {
                makeActiveButton(this.id);
                draw(this.id);
            });

            function draw(varname) {
                var centers = getCenters(varname);
                force.on("tick", tick(centers, varname));
                labels(centers)
                force.start();
            }

            function tick(centers, varname) {
                var foci = {};
                for (var i = 0; i < centers.length; i++) {
                    foci[centers[i].name] = centers[i];
                }
                return function(e) {
                    for (var i = 0; i < data.length; i++) {
                        var o = data[i];
                        var f = foci[o[varname]];
                        o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
                        o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
                    }
                    nodes.each(collide(.11))
                        .attr("cx", function(d) {
                            return d.x;
                        })
                        .attr("cy", function(d) {
                            return d.y;
                        });
                }
            }


            function labels(centers) {
                svgBubbles.selectAll(".labelBubbleChart").remove();
                svgBubbles.selectAll(".labelBubbleChart")
                    .data(centers).enter().append("text")
                    .attr("class", "labelBubbleChart")
                    .text(function(d) {
                        if (d.name === "Twentieth Century Fox Film Corporation") {
                            return "Twentieth Century Fox"
                        }
                        if (d.name === "American Broadcasting Company (ABC)") {
                            return "ABC"
                        }
                        if (d.name === "Walt Disney Studios Motion Pictures") {
                            return "Walt Disney Studios"
                        }
                        if (d.name === "Jamie Babbit, Amanda Brotchie, Steven K. Tsuchida, Christian Ditter, John Riggi") {
                            return "Jamie Babbit"
                        }
                        if (d.name === "Alexandra Cunningham and Kem Nunn") {
                            return "Alexandra Cunningham"
                        }
                        if (d.name === "Peter Elkoff and Victoria Morrow") {
                            return "Peter Elkoff"
                        }
                        if (d.name === "Sony Pictures Classics") {
                            return "Sony Pictures"
                        } else {
                            return d.name
                        }
                    })
                    .attr("transform", function(d) {
                        return "translate(" + (d.x + (d.dx / 5)) + ", " + (d.y + 20) + ")";
                    });
            }

            function collide(alpha) {
                var quadtree = d3v3.geom.quadtree(data);
                return function(d) {
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
        .classed("active", centered && function(d) {
            return d === centered;
        });

    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
}

//----------------------------------------------------------------------------------------------------------------------
// SUNBURST
//----------------------------------------------------------------------------------------------------------------------

// Define parameters.
var sunburstWidth = 760,
    sunburstHeight = 500,
    sunburstRadius = (Math.min(sunburstWidth, sunburstHeight) / 2) - 10;

// Add tooltip.
var sunburstTooltip = d3v3.select('body').append('div')
    .attr('class', 'hidden tooltip');

// Number format.
var formatNumber = d3v3.format(",d");

// Define scales.
var x = d3v3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3v3.scale.sqrt()
    .range([0, sunburstRadius]);

// Define color range.
var color = d3v3.scale.ordinal()
    .range(d3v3.range(33).map(d3v3.scale.linear()
        .domain([0, 33 - 1])
        .range(["#f4fc83", "#54daf2"])
        .interpolate(d3v3.interpolateLab)));

// Partition size.
var partition = d3v3.layout.partition()
    .value(function(d) {
        return d.size;
    });

// Create arc.
var arc = d3v3.svg.arc()
    .startAngle(function(d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
    })
    .endAngle(function(d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
    })
    .innerRadius(function(d) {
        return Math.max(0, y(d.y));
    })
    .outerRadius(function(d) {
        return Math.max(0, y(d.y + d.dy));
    });

// Create new svg element.
var sunburst = d3v3.select("body").select(".sunburst").append("svg")
    .attr("width", sunburstWidth)
    .attr("height", sunburstHeight)
    .append("g")
    .attr("transform", "translate(" + sunburstWidth / 2 + "," + (sunburstHeight / 2) + ")");

// Read JSON.
d3v3.json("sunburst.json", function(error, root) {
    if (error) throw error;

    // Add paths and tooltips.
    sunburst.selectAll("path")
        .data(partition.nodes(root))
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            return color((d.children ? d : d.parent).name);
        })
        .on("click", click)
        .on("mouseout", function(d) {
            sunburstTooltip.classed('hidden', true);
        })
        .on("mousemove", function(d) {
            var mouse = d3v3.mouse(sunburst.node()).map(function(d) {
                return parseInt(d);
            });
            if (d.name) {
                sunburstTooltip.classed('hidden', false)
                    .attr('style', 'left:' + (mouse[0] + 750) + 'px; top:' + (mouse[1] + 1350) + 'px')
                    .html("<p class=\"centerTip\">" + d.name + "</p>");
            };
        });
});

// Zoom in when clicked.
function click(d) {
    sunburst.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3v3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3v3.interpolate(y.domain(), [d.y, 1]),
                yr = d3v3.interpolate(y.range(), [d.y ? 20 : 0, sunburstRadius]);
            return function(t) {
                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
            };
        })
        .selectAll("path")
        .attrTween("d", function(d) {
            return function() {
                return arc(d);
            };
        });
}

d3v3.select(self.frameElement).style("height", sunburstHeight + "px");