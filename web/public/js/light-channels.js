var chan_number = 7;
// set the dimensions and margins of the graph
var margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 50
},
    width = 900 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%H:%M:%S");

var scalex = d3.scaleLinear().range([0, width]);
var scaley = d3.scaleLinear().range([height, 0]);

var svg = d3.select("#channel_chart1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

var ourdata = new Array();
var channeldata = new Array();
var channelintensitydetail = {};
var valueline; //TODO - array with selectable type
var tooltip;
var selectedpoint;
var debug;
var showeditscale = false;

d3.select("body")
    .on("keydown", function () {
        var c = d3.select("#channel_chart1").node();

        if (!selectedpoint) {
            return
        };
        switch (d3.event.keyCode) {
            case 37:
                if (d3.event.ctrlKey) {
                    selectedpoint.time = Math.round(selectedpoint.time / 60) * 60 - 360;
                } else {
                    selectedpoint.time = Math.round(selectedpoint.time / 60) * 60 - 60;
                }
                event.preventDefault();
                break;
            case 38:
                selectedpoint.power++;
                event.preventDefault();
                break;
            case 39:
                if (d3.event.ctrlKey) {
                    selectedpoint.time = Math.round(selectedpoint.time / 60) * 60 + 360;
                } else { selectedpoint.time = Math.round(selectedpoint.time / 60) * 60 + 60; }
                event.preventDefault();
                break;
            case 40:
                selectedpoint.power--;
                event.preventDefault();
                break;
        };
        if (selectedpoint.power < 0) {
            selectedpoint.power = 0;
        }
        if (selectedpoint.time < 0) {
            selectedpoint.time = 0;
        }
        if (selectedpoint.power > 100) {
            selectedpoint.power = 100;
        }
        if (selectedpoint.time > 86400) {
            selectedpoint.time = 86400;
        }
        updatedot(selectedpoint.channel);
        updatepath(selectedpoint.channel);
        tooltip.style("left", (scalex(selectedpoint.time) + margin.left + 4 + c.offsetLeft) + "px");
        if (showeditscale) {
            tooltip.style("top", (margin.top + c.offsetTop + scaley(selectedpoint.power * channeldata[selectedpoint.channel].brightness / 100) - 57) + "px");

        } else {
            tooltip.style("top", (margin.top + c.offsetTop + scaley(selectedpoint.power) - 57) + "px");
        }
        tooltip.select("#charttooltiptext").html(pretty_point(selectedpoint, "<br>"));
    });

d3.json("/channelprog/" + profile, function (error, json) {
    if (error) return console.warn(error);
    console.log("got channel program data for profile " + profile);
    json.forEach(function (d) {

        if (!ourdata[d.channel]) {
            ourdata[d.channel] = {
                data: [{
                    time: d.time,
                    power: +d.power,
                    channel: +d.channel
                }]
            }
        } else {
            ourdata[d.channel].data.push({
                time: d.time,
                power: +d.power,
                channel: +d.channel
            });
        }
    });
    d3.json("/channels/" + profile, function (error, json) {
        if (error) return console.warn(error);
        json.forEach(function (d) {
            channeldata[d.id] = {
                name: d.name,
                class: d.class,
                brightness: d.brightness,
            };
        });
        console.log(channeldata);
        build_chart(ourdata);
        
        updatepath();
        makechannelcontrolui();
    });


});

function build_chart(data) {
    var hours = [];
    for (i = 0; i <= 24; i++) {
        hours.push(i * 3600);
    }
    // scale the range of the data
    scalex.domain([0, 86400]);
    scaley.domain([0, 100]);

    // add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(scalex)
            .tickValues(hours)
            .tickSize(-height)
            .tickFormat(pretty_time))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-30)");

    // add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(scaley));

    valueline = d3.line()
        .x(function (d) {
            return scalex(d.time);
        })
        .y(function (d) {
            if (showeditscale) {
                return scaley(d.power * channeldata[d.channel].brightness / 100);
            } else {
                return scaley(d.power);
            }
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
    console.log("drag", d);
}

function dragged(d) {
    var nx = d3.event.x;
    var ny = d3.event.y;

    if (scaley.invert(ny) < 0) {
        ny = scaley(0);
    };
    if (scaley.invert(ny) > 100) {
        ny = scaley(100);
    };
    if (scalex.invert(nx) < 0) {
        nx = scalex(0);
    };
    if (scalex.invert(nx) > 86400) {
        nx = scalex(86400);
    };


    d3.select(this).attr("cx", d.x = nx).attr("cy", d.y = ny);
    d.power = scaley.invert(ny);
    if (showeditscale) {
        d.power = d.power * 100 / channeldata[d.channel].brightness;
        if (d.power > 100) {
            d.power = 100;
        }
    }
    d.time = scalex.invert(nx);

    ourdata[d.channel].data.sort(function (a, b) {
        return (a.time - b.time);
    });
    updatepath(d.channel);
    updateform(d.channel);

    tooltip.style("left", (d3.event.sourceEvent.pageX + 4) + "px")
        .style("top", (d3.event.sourceEvent.pageY - 57) + "px");
    tooltip.select("#charttooltiptext").html(pretty_point(d, "<br>"));
}

function dragended(d) {
    d3.select(this).classed("active", false);
    updatedot(d.channel);
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
            if (showeditscale) {
                return scaley(d.power * channeldata[d.channel].brightness / 100);
            } else {
                return scaley(d.power);
            }
        })
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .8);
            tooltip.style("left", (d3.event.pageX + 4) + "px")
                .style("top", (d3.event.pageY - 57) + "px");
            tooltip.select("#charttooltiptext").html(pretty_point(d, "<br>"));
            tooltip.select("#buttonremove").on("click", removedot);
            tooltip.select("#buttonadd").on("click", adddot);
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
            if (showeditscale) {
                return scaley(d.power * channeldata[d.channel].brightness / 100);
            } else {
                return scaley(d.power);
            }
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

function adddot() {
    var index = ourdata[selectedpoint.channel].data.indexOf(selectedpoint);
    //Dont allow the first or last elements to be deleted
    if ((index == ourdata[selectedpoint.channel].data.length) && (index > 0)) {
        index -= 1;
        selectedpoint = ourdata[selectedpoint.channel].data[index];
    }
    var newpoint = {};
    Object.assign(newpoint, selectedpoint);
    newpoint.power = (newpoint.power + ourdata[selectedpoint.channel].data[index + 1].power) / 2;
    newpoint.time = (newpoint.time + ourdata[selectedpoint.channel].data[index + 1].time) / 2;
    //insert
    ourdata[selectedpoint.channel].data.splice(index + 1, 0, newpoint);
    console.log("Add: ", selectedpoint, newpoint);
    updatepath(selectedpoint.channel);
    updateform(selectedpoint.channel);
    updatedot(selectedpoint.channel);

}

function updateform(i) {
    var t = d3.select("#pointlist" + i).selectAll("li").data(ourdata[i].data).enter().append("li").append("span").text(pretty_point);
    var t = d3.select("#pointlist" + i).selectAll("li").data(ourdata[i].data).select("span").text(pretty_point).on("mouseover", function (d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .8);
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
        tt.append("a").attr("class", "collapsed btn btn-xs channel" + i).attr("role", "button").attr("data-toggle", "collapse").attr("data-parent", "#accordion").attr("href", "#collapse" + i).attr("aria-expanded", "true").attr("aria-controls", "collapse" + i).text("Channel #" + i);
        debug = tt.append("input").attr("style", "margin: 0px 5px 0px 5px;").attr("type", "text").attr("data-provider", "slider");
        ourdata[i].brightness = new Slider(debug.node(), {
            tooltip: "hide",
            max: 100,
            value: channeldata[i].brightness
        });
        ourdata[i].brightness.on("slide", function (d) {
            for (i = 0; i < chan_number; i++) {
                channeldata[i].brightness = ourdata[i].brightness.getValue();
                d3.select("#brightness" + i).node().value = channeldata[i].brightness;
                updatedot(i);
                updatepath(i);
            }
        });
        tt.append("input").attr("style", "margin: 0px 5px 0px 5px;").attr("id", "brightness" + i).attr("min", "0").attr("max", "100").attr("data", i).attr("type", "number").attr("value", channeldata[i].brightness).on("change", function (d) {
            for (i = 0; i < chan_number; i++) {
                channeldata[i].brightness = d3.select("#brightness" + i).node().value;
                ourdata[i].brightness.setValue(channeldata[i].brightness);

            }
            console.log(d, this);
        });
        tt.append("div").attr("class", "btn btn-default btn-xs").attr("data", i).text("Save").on("click", function (d) {
            savechan(this.attributes.data.value);
        });

        var contents = t.append("div").attr("id", "collapse" + i).attr("class", "panel-collapse collapse").attr("role", "tabpanel").attr("aria-labelledby", "heading" + i)
            .append("div").attr("class", "panel-body").append("form").attr("class", "form-inline");
        var t = contents.append("div").attr("class", "form-group");
        t.append("label").attr("for", "EditName" + i).text("Name");
        t.append("input").attr("type", "text").attr("data", i).attr("class", "form-control").attr("id", "EditName" + i).attr("value", channeldata[i].name)
            .on("change", function (d) {
                channeldata[this.attributes.data.value].name = this.value;
            });
        var t = contents.append("div").attr("class", "form-group");
        t.append("label").attr("for", "EditClass" + i).text("Class");
        t.append("input").attr("type", "text").attr("class", "form-control").attr("id", "EditClass" + i).attr("value", channeldata[i].class);
        var ul = contents.append("ul").attr("id", "pointlist" + i);

        updateform(i);
    }
}

function pretty_point(point, linebreak) {

    if (typeof (linebreak) === 'number' || linebreak instanceof Number) {
        linebreak = " ";
    }
    return "Time: " + pretty_time(point.time) + linebreak + "Power %: " + Math.round(point.power);
}

function pretty_time(seconds, i) {

    var date = new Date(seconds * 1000);
    var hh = date.getUTCHours();
    var mm = date.getUTCMinutes();
    var ss = date.getSeconds();
    if (hh < 10) {
        hh = "0" + hh;
    }
    if (mm < 10) {
        mm = "0" + mm;
    }
    if (ss < 10) {
        ss = "0" + ss;
    }
    if (ss == 0) {
        return hh + ":" + mm
    }
    return hh + ":" + mm + ":" + ss;
}

function savechan(chan) {
    console.log("Save chan:" + chan + " Profile:" + profile);
    d3.request("/channels/" + profile)
        .header("Content-Type", "application/json")
        .post(JSON.stringify({
            profile: profile,
            chanid: chan,
            chan: channeldata[chan],
            data: ourdata[chan].data
        }),
        function (err, rawData) {
            var data = JSON.parse(rawData.response);
            console.log("got response", data);
        }
        );
    updateintensity(chan);    
}

function swapviewtype() {
    console.log("change scale", d3.select('input[name="optionsRadios"]:checked').node().value);
    showeditscale = (d3.select('input[name="optionsRadios"]:checked').node().value == "scaled");
    for (i = 0; i < chan_number; i++) {
        updatepath(i);
        updatedot(i);

    }
}

function updateintensity(channel) {
    console.log("update intensity");
    var channelpath = d3.select("#channel" + channel).node();
    var len = channelpath.getTotalLength();
    var interval = 10;
    var lx = 0;
    var ly = 0;
    channelintensitydetail = {
        data: [],
        brightness: channeldata[channel].brightness,
        channel: channel 
    };
    for (i = 0; i < len; i++) {
        var p = channelpath.getPointAtLength(i);
        var x = Math.round(scalex.invert(p.x) / interval);
        var y = scaley.invert(p.y)*channeldata[channel].brightness/100*2.55;
        for (ix = lx; ix <= x; ix++) {
            channelintensitydetail.data[ix]={time: ix * interval, power: y};
        }
        lx = x;
        ly = y;
    }
    for (ix = lx; ix <= 86400/interval; ix++) {
            channelintensitydetail.data[ix]={time: ix * interval, power: ly};
    }
  console.log("Save intensity:" + channel + "Profile:" + profile);
    d3.request("/saveintensity/" + profile)
        .header("Content-Type", "application/json")
        .post(JSON.stringify({
            profile: profile,
            channel: channel,
            data: channelintensitydetail.data
        }),
        function (err, rawData) {
            var data = JSON.parse(rawData.response);
            console.log("got response", data);
        }
    );
    
}