	// The Radar Chart Function

function RadarChart(id, data, options) {
	var cfg = {
	 w: 600,				//Width of the circle
	 h: 600,				//Height of the circle
	 margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
	 levels: 10,				//How many levels or inner circles should there be drawn
	 maxValue: 10, 			//What is the value that the biggest circle will represent
	 labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
	 wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
	 opacityArea: 0.35, 	//The opacity of the area of the blob
	 dotRadius: 4, 			//The size of the colored circles of each blog
	 opacityCircles: 0.1, 	//The opacity of the circles of each blob
	 strokeWidth: 2, 		//The width of the stroke around each blob
	 roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
	 color: d3.scale.category10()	//Color function
};

//Put all of the options into a variable called cfg
if('undefined' !== typeof options){
  for(var i in options){
	if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
  }//for i
}//if

//If the supplied maxValue is smaller than the actual one, replace by the max in the data
var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
	
var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
	total = allAxis.length,					//The number of different axes
	radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
	Format = d3.format(1),			 		//Number formatting
	angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

//Scale for the radius
var rScale = d3.scale.linear()
	.range([0, radius])
	.domain([0, maxValue]);
	
// Create the container SVG and g
//Remove whatever chart with the same id/class was present before
d3.select(id).select("svg").remove();

//Initiate the radar chart SVG
var svg = d3.select(id).append("svg")
		.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
		.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
		.attr("class", "radar"+id);
//Append a g element		
var g = svg.append("g")
		.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

// Draw the Circular grid
//Wrapper for the grid & axes
var axisGrid = g.append("g").attr("class", "axisWrapper");

//Draw the background circles
axisGrid.selectAll(".levels")
   .data(d3.range(1,(cfg.levels+1)).reverse())
   .enter()
	.append("circle")
	.attr("class", "gridCircle")
	.attr("r", function(d, i){return radius/cfg.levels*d;})
	.style("fill", "#CDCDCD")
	.style("stroke", "#CDCDCD")
	.style("fill-opacity", cfg.opacityCircles);

// Draw the axes 
//Create the straight lines radiating outward from the center
var axis = axisGrid.selectAll(".axis")
	.data(allAxis)
	.enter()
	.append("g")
	.attr("class", "axis");
//Append the lines
axis.append("line")
	.attr("x1", 0)
	.attr("y1", 0)
	.attr("x2", function(d, i){ return rScale(maxValue) * Math.cos(angleSlice*i - Math.PI/2); })
	.attr("y2", function(d, i){ return rScale(maxValue) * Math.sin(angleSlice*i - Math.PI/2); })
	.attr("class", "line")
	.style("stroke", "#CDCDCD")
	.style("stroke-width", "1px");

//Append the labels at each axis
axis.append("text")
	.attr("class", "legend")
	.style("font-size", "16px")
	.attr("text-anchor", "middle")
	.attr("dy", "0.35em")
	.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
	.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
	.text(function(d){return d})
	.call(wrap, cfg.wrapWidth);

// Draw the radar chart blobs
//The radial line function
var radarLine = d3.svg.line.radial()
	.interpolate("linear-closed")
	.radius(function(d) { return rScale(d.value); })
	.angle(function(d,i) {	return i*angleSlice; });
	
if(cfg.roundStrokes) {
	radarLine.interpolate("cardinal-closed");
}
			
//Create a wrapper for the blobs
var people = ["pm","qm","dm"];	
var blobWrapper = g.selectAll(".radarWrapper")
	.data(data)
	.enter().append("g")
	.attr("class", "radarWrapper");
	//.attr("id", function(d, i){var result = people[i]+''; return result; });
		
//Append the backgrounds	
blobWrapper
	.append("path")
	.attr("class", "radarArea")
	.attr("id", function(d, i){var result = people[i]; return result; })
	.attr("d", function(d,i) { return radarLine(d); })
	.style("fill", function(d,i) { return cfg.color(i); })
	.style("fill-opacity", cfg.opacityArea)
	.on('mouseover', function (d,i){
		d3.selectAll(".radarArea")
			.transition().duration(200)
			.style("fill", "grey")
			.style("fill-opacity", 0.1); 
		//Bring back the hovered over blob
		d3.select(this)
			.transition().duration(200)
			.style("fill", cfg.color(i))
			.style("fill-opacity", 0.7);
		var checked = this.id;
		document.chartSelector.selected[i+1].checked=true;
	})
	.on('mouseout', function(){
		//Bring back all blobs
		document.chartSelector.selected[0].checked=true;
		d3.selectAll(".radarArea")
			.transition().duration(200)
			.style("fill", function(d,i) { return cfg.color(i); })
			.style("fill-opacity", cfg.opacityArea);
	});

// Radio button highlighter
var rad = document.chartSelector.selected;
var prev = null;
var selected = null;
for(var i = 0; i < rad.length; i++) {
    rad[i].onclick = function() {
        if(this !== prev) {
            prev = this;
            selected = this.id;
        }
        	if(selected == "all"){
					//Bring back all blobs
					d3.selectAll(".radarArea")
						.transition().duration(200)
						.style("fill", function(d,i) { return cfg.color(i); })
						.style("fill-opacity", cfg.opacityArea);
        	}

        	else {

            d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill", "grey")
				.style("fill-opacity", 0.1); 
			//Bring back the hovered over blob
			d3.select("#"+selected)
				.transition().duration(200)
				.style("fill", cfg.color(this.value))
				.style("fill-opacity", 0.7);
			}
		};
}	
	
// Helper Function 
//Taken from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text	
function wrap(text, width) {
  text.each(function() {
	var text = d3.select(this),
		words = text.text().split(/\s+/).reverse(),
		word,
		line = [],
		lineNumber = 0,
		lineHeight = 1.4, // ems
		y = text.attr("y"),
		x = text.attr("x"),
		dy = parseFloat(text.attr("dy")),
		tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
		
	while (word = words.pop()) {
	  line.push(word);
	  tspan.text(line.join(" "));
	  if (tspan.node().getComputedTextLength() > width) {
		line.pop();
		tspan.text(line.join(" "));
		line = [word];
		tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
	  }
	}
  });
}//wrap	
	
}
