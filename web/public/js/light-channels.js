var chan_number = 6;
// set the dimensions and margins of the graph
var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50
    },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%H:%M:%S");

var scalex = d3.scaleTime().range([0, width]);
var scaley = d3.scaleLinear().range([height, 0]);

var svg = d3.select("#channel_chart1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var ourdata = new Array();
var channeldata = new Array();
var valueline; //TODO - array with selectable type
var tooltip;
var selectedpoint;
var debug;

// get the data
/*d3.csv("data.csv", function (error, data) {
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
});*/
d3.json("/channelprog/" + profile, function (error, json) {
    if (error) return console.warn(error);
    console.log("got channel program data for profile " + profile);
    json.forEach(function (d) {
        if (!ourdata[d.channel]) {
            ourdata[d.channel] = {
                data: [{
                    time: parseTime(d.time),
                    power: +d.power,
                    channel: +d.channel
                }]
            }
        } else {
            ourdata[d.channel].data.push({
                time: parseTime(d.time),
                power: +d.power,
                channel: +d.channel
            });
        }
    });
    d3.json("/channels/", function (error, json) {
        if (error) return console.warn(error);
        json.forEach(function (d) {
            channeldata[d.id] = {
                name: d.name,
                class: d.class
            };
        });

        build_chart(ourdata);
        updatepath();
        makechannelcontrolui();
    });


});

function build_chart(data) {
    // scale the range of the data
    scalex.domain([parseTime("00:00:00"), parseTime("24:00:00")]);
    scaley.domain([0, 100]);

    // add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(scalex)
            .ticks(24)
            .tickSize(-height)
            .tickFormat(d3.timeFormat("%H:%M")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-25)");

    // add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(scaley));

    valueline = d3.line()
        .x(function (d) {
            return scalex(d.time);
        })
        .y(function (d) {
            return scaley(d.power);
        })
        .curve(d3.curveMonotoneX);

    for (i = 0; i < chan_number; i++) {
        svg.append("path")
            .data([data[i].data])
            .attr("class", "channel" + i)
            .attr("d", valueline).attr("id", "channel" + i);
        updatepath(i);
        updatedot(i);
    }

    tooltip = d3.select("#charttooltip");

}

function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    var nx = d3.event.x;
    var ny = d3.event.y;

    if (scaley.invert(ny) < 0) {
        ny = scaley(0)
    };
    if (scaley.invert(ny) > 100) {
        ny = scaley(100)
    };
    if (scalex.invert(nx) < parseTime("00:00:00")) {
        nx = scalex(parseTime("00:00:00"))
    };
    if (scalex.invert(nx) > parseTime("24:00:00")) {
        nx = scalex(parseTime("24:00:00"))
    };


    d3.select(this).attr("cx", d.x = nx).attr("cy", d.y = ny);
    d.power = scaley.invert(ny);
    d.time = scalex.invert(nx);

    ourdata[d.channel].data.sort(function (a, b) {
        return (a.time < b.time)
    });
    updatepath(d.channel);
    updateform(d.channel);
    
    tooltip.style("left", (d3.event.sourceEvent.pageX + 4) + "px")
        .style("top", (d3.event.sourceEvent.pageY - 57) + "px");
    tooltip.select("#charttooltiptext").html(pretty_point(d, "<br>"));
}

function dragended(d) {
    d3.select(this).classed("active", false);
}

function updatepath(i) {
    svg.selectAll("#channel" + i).attr("d", valueline);
}

function updatedot(i) {

    if (svg.select("#channeldots" + i).empty()) {
        console.log("new " + i);
        svg.append("g").attr("id", "channeldots" + i);
    }
    svg.select("#channeldots" + i).selectAll("circle")
        .data(ourdata[i].data)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function (d) {
            return scalex(d.time);
        })
        .attr("cy", function (d) {
            return scaley(d.power);
        })
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .8);
            tooltip.style("left", (d3.event.pageX + 4) + "px")
                .style("top", (d3.event.pageY - 57) + "px");
            tooltip.select("#charttooltiptext").html(pretty_point(d, "<br>"));
            tooltip.select("#buttonremove").on("click", removedot);
            selectedpoint = d;
        })
        //.on("mouseout", function(d) {       
        //    tooltip.transition()        
        //        .duration(500)      
        //        .style("opacity", 0);   
        //})
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    svg.select("#channeldots" + i).selectAll("circle").data(ourdata[i].data)
        .attr("cx", function (d) {
            return scalex(d.time);
        })
        .attr("cy", function (d) {
            return scaley(d.power);
        });

    svg.select("#channeldots" + i).selectAll("circle").data(ourdata[i].data).exit().remove();


}

function removedot() {
    var index = ourdata[selectedpoint.channel].data.indexOf(selectedpoint);
    //Dont allow the first or last elements to be deleted
    if ((index > 0) && (index < ourdata[selectedpoint.channel].data.length)) {
        ourdata[selectedpoint.channel].data.splice(index, 1);
    }
    updatepath(selectedpoint.channel);
    updateform(selectedpoint.channel);
    updatedot(selectedpoint.channel);
    console.log("Update: " + selectedpoint.channel);
    tooltip.style("opacity", "0");

}

function updateform(i) {
    var t = d3.select("#pointlist" + i).selectAll("li").data(ourdata[i].data).enter().append("li").append("span").text(pretty_point);
    var t = d3.select("#pointlist" + i).selectAll("li").data(ourdata[i].data).select("span").text(pretty_point).on("mouseover", function (d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .8);
        debug = d3.event;
        var bodyRect = document.body.getBoundingClientRect();

        tooltip.style("left", (d3.event.target.getBoundingClientRect().right) + "px")
            .style("top", (d3.event.target.getBoundingClientRect().bottom - bodyRect.top - 70) + "px");
        tooltip.select("#charttooltiptext").html(pretty_point(d, "<br>"));
        tooltip.select("#buttonremove").on("click", removedot);
        selectedpoint = d;
    });
    d3.select("#pointlist" + i).selectAll("li").data(ourdata[i].data).exit().remove();
}

function makechannelcontrolui() {
    d3.select("#channel_controls").html('<div class="panel-group" id="accordion0" role="tablist" aria-multiselectable="true"></div>');
    var acc = d3.select("#accordion0");
    for (i = 0; i < chan_number; i++) {
        var t = acc.append("div").attr("class", "panel panel-default");
        var tt = t.append("div").attr("class", "panel-heading").style("padding", "2px").attr("role", "tab").attr("id", "heading" + i)
        tt.append("h4").attr("class", "panel-title");
        tt.append("a").attr("class", "collapsed btn btn-xs no-padding channel" + i).attr("role", "button").attr("data-toggle", "collapse").attr("data-parent", "#accordion").attr("href", "#collapse" + i).attr("aria-expanded", "true").attr("aria-controls", "collapse" + i).text("Channel #" + i);
        var contents = t.append("div").attr("id", "collapse" + i).attr("class", "panel-collapse collapse").attr("role", "tabpanel").attr("aria-labelledby", "heading" + i)
            .append("div").attr("class", "panel-body").append("form").attr("class", "form-inline");
        var t = contents.append("div").attr("class", "form-group");
        t.append("label").attr("for", "EditName" + i).text("Name");
        t.append("input").attr("type", "text").attr("class", "form-control").attr("id", "EditName" + i).attr("value", channeldata[i].name);
        var t = contents.append("div").attr("class", "form-group");
        t.append("label").attr("for", "EditClass" + i).text("Class");
        t.append("input").attr("type", "text").attr("class", "form-control").attr("id", "EditClass" + i).attr("value", channeldata[i].class);
        var t = contents.append("div").attr("class", "form-group");
        t.append("button").attr("type", "submit").attr("class", "btn btn-default").text("Update");
        var ul = contents.append("ul").attr("id", "pointlist" + i);

        updateform(i);
    }
}

function pretty_point(point, linebreak) {
 
    if (typeof(linebreak) === 'number' || linebreak instanceof Number) {
        linebreak = " ";
    }
    return "Time: " + d3.timeFormat("%H:%M")(point.time) + linebreak + "Power %: " + Math.round(point.power);
}