
// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 30, left: 50 },
    width = 600 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%H:%M");

var scalex = d3.scaleTime().range([0, width]);
var scaley = d3.scaleLinear().range([height, 0]);

var svg = d3.select("#channel_chart1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")")
    ;

var ourdata = new Array();
var valueline;

// get the data
d3.csv("data.csv", function (error, data) {
    if (error) throw error;

    // format the data
    data.forEach(function (d) {
        if (!ourdata[d.channel]) {ourdata[d.channel] = {data: [{time: parseTime(d.time), power : +d.power, channel : +d.channel}]}}
        else { ourdata[d.channel].data.push({time: parseTime(d.time), power : +d.power, channel : +d.channel});}
    });

    
    build_chart(ourdata[1].data);
    updatepath();
    console.log(chan1.node().getPointAtLength(600));
    console.log(chan1.node().getTotalLength());
});

function build_chart(data) {
    // scale the range of the data
    scalex.domain(d3.extent(data, function (d) { return d.time; }));
    scaley.domain([0, d3.max(data, function (d) { return d.power; })]);

    // add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(scalex)
            .ticks(12)
            .tickFormat(d3.timeFormat("%H:%M")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-25)")
        ;

    // add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(scaley));

    valueline = d3.line()
        .x(function (d) { return scalex(d.time); })
        .y(function (d) { return scaley(d.power); })
        .curve(d3.curveMonotoneX)
        ;

    chan1 = svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline).attr("id", "chan1")
        ;

    updatepath();
    updatedot();
}

function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    var nx=d3.event.x;
    var ny=d3.event.y;

    if (scaley.invert(ny) <0) { ny=scaley(0)};
    if (scaley.invert(ny) >100) { ny=scaley(100)};
    if (scalex.invert(nx) < parseTime("00:00")) { nx=scalex(parseTime("00:00")) };
    if (scalex.invert(nx) >parseTime("24:00")) { nx=scalex(parseTime("24:00")) };
    
    d3.select(this).attr("cx", d.x = nx).attr("cy", d.y = ny);
    d.power = scaley.invert(ny);
    d.time = scalex.invert(nx);
    
    ourdata[d.channel].data.sort(function (a, b) {return (a.time < b.time)});
    updatepath();
    
}

function dragended(d) {
    d3.select(this).classed("active", false);
}

function updatepath() {
    svg.selectAll("#chan1").attr("d", valueline);
}
function updatedot() {

    svg.selectAll("circle")
        .data(ourdata[1].data)
        .enter().append("circle")
        .attr("r", 4)
        .attr("cx", function (d) { return scalex(d.time); })
        .attr("cy", function (d) { return scaley(d.power); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    svg.selectAll("circle").data(ourdata[1].data).transition().duration(1000).attr("r", 6)
        .attr("cx", function (d) { return scalex(d.time); })
        .attr("cy", function (d) { return scaley(d.power); });

    svg.selectAll("circle").data(ourdata[1].data).exit().remove();
}