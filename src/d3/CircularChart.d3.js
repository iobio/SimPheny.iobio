import * as d3 from "d3";

//Setting colors for organization
const colors = {
    // "strokeGreen": "#099509",
    "strokeGreen": "#78049F",
    // "fillGreen": "#18F218",
    "fillGreen": "#FAEBFF",

    "strokePurple": "#8A05B6",
    "fillPurple": "#D765FC",

    "strokeBlack": "#0A0A0A",
    "fillBlack": "#333333",

    // "strokeTeal": "#007991",
    "strokeTeal": "#78049F",
    // "fillTeal": "#33DDFF",
    "fillTeal": "#EFC2FE",

    // "strokeBlue": "#3855A5",
    "strokeBlue": "#047600",
    // "fillBlue": "#3855A5",
    "fillBlue": "#21E438",

    "targetPurple": "purple",
    // "chartMain": "#376C35",
    "chartMain": "#3C5D3A",
    "chartLettersGrey": "#5F5661",
    // "chartLightPurple": "#DCCFDD",
    "chartLightPurple": "#CEE0CD",
}

export default function CircularChart() {

    var width = 600;
    var height = 300;

    var xMin = 1;
    var xMax = 0;

    var marginRight = 30;
    var marginBottom = 40;
    var marginLeft = 40;
    var chartId = "CircularChartD3";

    var selectedMatches = [];
    var selectedMatchesObj = {};
    var hoveredMatchesList = [];
    var hoveredMatchesObj = {};
    var anglesMap = {};

    var onMatchSelectedCallback = function() {};
    var onRectangleSelectedCallback = function() {};

    function chart(container, matchesObj) {
        //Set max radius
        let maxRadius = (width - marginRight - marginLeft); 

        //Scaling function: scales similarity scores based on the max radius
        var radiusScale = d3.scaleLinear()
            .domain([xMin, xMax]) // Input range
            .range([0, maxRadius]); // Output range
        
        //Calcluate the center x and y coordinate
        var centerX = marginLeft;
        var centerY = height - marginBottom;

        // Create the SVG
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", chartId);

        svg.attr("viewBox", [0, 0, width, height + 10]); //ViewBox

        //Create the chart origin and the patient symbol
        createOriginSymbols(svg, marginLeft, height, marginBottom);

        let xTicks = radiusScale.ticks(6);
        let xHalfTics = radiusScale.ticks(12);
  
        for (let i = 0; i < xHalfTics.length; i++) {
            let tic = xHalfTics[i];
            //create the arc based on the tic
            var radius = radiusScale(tic);

            if (i < xHalfTics.length - 1) {
                var nextTic = xHalfTics[i + 1];
                var nextRadius = radiusScale(xHalfTics[i + 1]);
            } else {
                var nextTic = xMax;
                var nextRadius = maxRadius; //the last tic should be the max radius
            }

            //increase opacity as i increases
            let opacity = 1 - ((i) * 0.06);

            //create a group for the arcSection and the rectangle
            let arcSectionGroup = svg.append("g");
        
            //create the arc section
            let arcSection = createArcSection(radius, nextRadius);

            //add the arc section to the svg
            arcSectionGroup.append("path")
                .attr("d", arcSection)
                .attr("stroke", 'white')
                .attr("fill", colors.chartMain)
                .attr("class", "arc-section")
                .attr("opacity", opacity)
                .attr("transform", `translate(${marginLeft},${height - marginBottom})`)
                //the arc needs to be behind the points so that the mouseover event can be handled
                .lower();

            //put a rectangle with rounded edges at the end of the arc on the bottom of the arc
            // arcSectionGroup.append("rect")
            //     .attr("width", nextRadius - radius)
            //     .attr("height", 10)
            //     .attr("fill", colors.chartMain)
            //     .attr("rx", 2)
            //     .attr("ry", 2)
            //     .attr("stroke", "white")
            //     .attr("opacity", opacity)
            //     .attr("cursor", "pointer")
            //     .attr("transform", `translate(${marginLeft + radius},${height - marginBottom})`)
            //     .on("mouseover", function(event) {
            //         //change the color to purple
            //         d3.select(this)
            //             .attr("fill", "purple")
            //             .attr("opacity", 1);

            //         //select the parent then get the first child 
            //         let arcSection = d3.select(this.parentNode).select(".arc-section");
            //         arcSection.attr("fill", "purple")
            //     })
            //     .on("mouseout", function(event) {
            //         //change back to its original color
            //         d3.select(this)
            //             .attr("fill", colors.chartMain)
            //             .attr("opacity", opacity);
                    
            //         //select the parent then get the first child which is the arc section
            //         let arcSection = d3.select(this.parentNode).select(".arc-section");
            //         arcSection.attr("fill", colors.chartMain)
            //     })
            //     .on("click", createRectangleClickHandler(tic, nextTic, matchesObj)); 
        }
        //Create the slider
        //Slider bar should only be from the minimum radius to the max radius of the chart
        let start = radiusScale(xHalfTics[0]);
        let slider = svg.append("g")
            .attr("transform", `translate(${marginLeft + start},${height - marginBottom + 2})`);

        //Create the slider rectangle
        slider.append("rect")
            .attr("width", maxRadius - start)
            .attr("height", 10)
            .attr("fill", colors.chartMain)
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("stroke", "white")
            .attr("opacity", 0.5);

        //Create a shadow for the handle to use with defs
        
        svg.append("defs")
            .append("filter")
            .attr("id", "shadowFilter")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%")
            .append("feDropShadow")
            .attr("dx", "0")  // No horizontal offset
            .attr("dy", "0")  // No vertical offset
            .attr("stdDeviation", "2")  // Blur amount
            .attr("flood-color", "black");

        //Create the slider handle
        let sliderHandle = slider.append("rect")
            .attr("width", 8)
            .attr("height", 12)
            .attr("fill", colors.targetPurple)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("transform", `translate(0, -1)`)
            .attr("cursor", "pointer")
            .attr("filter", "url(#shadowFilter)");

        //Make the slider handle draggable over the slider bar but the handle should return the corresponding similarity score value of its position
        let drag = d3.drag()
            .on("drag", function(event) {
                //get the x position of the mouse event at the center of the handle
                let x = event.x - marginLeft + start + 5 + 2;
                //if the x position is less than 0 then set it to 0
                if (x < 0) {
                    x = 0;
                }
                //if the x position is greater than the max radius then set it to the max radius
                if (x > (maxRadius - start)) {
                    x = maxRadius - start;
                }
                //set the x position of the slider handle
                sliderHandle.attr("x", x);
                //if arc path exists remove it
                if (svg.select("#arc-path-for-slider").node()) {
                    svg.select("#arc-path-for-slider").remove();
                }

                //make an arc based on the x position
                //make sure the x position is in the middle of the slider handle
                let arc = createArc((x + start), (centerX - start ), centerY);
                //add the arc to the svg with an id, ensure it is in the middle of the slider handle
                svg.append("path")
                    .attr("d", arc)
                    .attr("stroke", colors.targetPurple)
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .attr("id", "arc-path-for-slider")
                    .attr("transform", `translate(${start}, 0)`);

                //raise the slider handle to the top
                sliderHandle.raise();
            })
            .on( "end", function(event) {
                let x = event.x - marginLeft + start*2 + 5 + 2; //The true x position useful for calculating the similarity score
                let similarityScore = radiusScale.invert(x);
                //call the callback function
                sliderSelectHandler(similarityScore, matchesObj);
            });

        //Add the drag event to the slider
        sliderHandle.call(drag);

        //Tic Labels
        svg.append("g")
            .selectAll("text")
            .data(xTicks)
            .join("text")
                .text(function(d) {
                    return String(d).replace(/^0+/, '');
                })
                .attr("x", function(d) {
                    let coords = polarToCartesian(radiusScale(d), 0, centerX, centerY);
                    return coords.x;
                })
                .attr("y", height - marginBottom + 18)
                .attr("font-size", "10px")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("transform", `translate(3, 0)`)
                .attr("fill", colors.chartLettersGrey);
        
        //In case there are no matches return
        if (!matchesObj) {
            return;
        }
        //group for the selected matches arcs
        var selectedMatchesGroup = svg.append("g")
        .attr("id", "selected-matches-group");

        //if there is a selected match add the arc
        if (selectedMatches) {
            for (let match of selectedMatches) {
                //create the arc based on the similarity score
                let radius = radiusScale(match.similarityScore);
                let arc = createArc(radius, centerX, centerY);

                //add the arc to the svg
                selectedMatchesGroup.append("path")
                    .attr("d", arc)
                    .attr("stroke", colors.strokeBlue)
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
                    .attr("id", match.id + "-arc");
            }
        }
        selectedMatchesGroup.raise();
        //Matches Group
        let matchPoints = svg.append("g")

        //The array of matches objects
        let matchesArray = Object.values(matchesObj);
        //Add all the matches to their group and the svg
        matchPoints.append("g")
            .selectAll("matches")
            .data(matchesArray)
            .enter()
            .append("path")
            .attr("d", d => determineShape(d))
            .classed("selected-match", function(d) {
                    if (selectedMatchesObj && Object.keys(selectedMatchesObj).length > 0) {
                        if (d.id in selectedMatchesObj) {
                            return true;
                        }
                    }
                    return false;
            })
            .classed("hovered-from-matches", function(d) {
                    if (hoveredMatchesObj && Object.keys(hoveredMatchesObj).length > 0) {
                        if (d.id in hoveredMatchesObj) {
                            return true;
                        }
                    }
                    return false;
            })
            .attr("transform", function(d) {
                let result = determineXY(d, centerX, centerY, radiusScale, anglesMap)
                let xy = result.xy;
                anglesMap = result.anglesMap;

                if (hoveredMatchesObj && hoveredMatchesList.length) {
                    if (d.id in hoveredMatchesObj) {
                        xy = xy + " scale(1.5)";
                    }
                }
                return xy;
            })
            .attr("fill", d => determineFill(d, selectedMatchesObj, hoveredMatchesObj))
            .attr("stroke", d => determineStroke(d, selectedMatchesObj, hoveredMatchesObj))
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                mouseOverMatch(event, d, svg, radiusScale, centerX, centerY);
            })
            .on("mouseout", function(event, d) {
                mouseOutMatch(event, d, svg, radiusScale, centerX, centerY);
            })
            .on("click", function(event, d) {
                // clickMatch(event, d, svg, radiusScale, centerX, centerY);
                createMatchClickHandler(d);
            });
        
        matchPoints.raise();

        if (hoveredMatchesList.length > 0) {
            //raise the hovered matches to the top
            d3.selectAll(".hovered-from-matches").raise();
        }

        //Handles the rectangle click event
        function createRectangleClickHandler(tic, nextTic, matchesObj) {
            return function(event) {
                let matches = [];
                let alreadySelected = d3.selectAll(".selected-match").data();

                for (let match of Object.values(matchesObj)) {
                    if ((match.similarityScore <= tic) && (match.similarityScore >= nextTic)) {
                        if (alreadySelected.includes(match)) {
                            alreadySelected.splice(alreadySelected.indexOf(match), 1);
                            continue;
                        } else {
                            matches.push(match);
                        }
                    }
                }
                matches = matches.concat(alreadySelected);
                //call the callback function
                onRectangleSelectedCallback(matches);
            };
        }

        //Handles the slider selection event
        function sliderSelectHandler(similarityScore, matchesObj) {
            let matches = [];
            //just make sure all the matches that are higher than the x position are selected
            for (let match of Object.values(matchesObj)) {
                if (match.similarityScore >= similarityScore) {
                    matches.push(match);
                }
            }
            //call the callback function
            onRectangleSelectedCallback(matches);
        }

        //Handles the single match click event
        function createMatchClickHandler(match) {
            //if match is already selected then deselect it
            let matchId = match.id;
            if (matchId in selectedMatchesObj) {
                delete selectedMatchesObj[matchId];
            } else {
                selectedMatchesObj[matchId] = match;
            }

            //if selected matches is empty then clear the selected matches
            if (Object.keys(selectedMatchesObj).length === 0) {
                selectedMatchesObj = {};
                //call the callback function
                onMatchSelectedCallback([]);
            } else {
                //call the callback function
                onMatchSelectedCallback(Object.values(selectedMatchesObj));
            }
        }

        //Add the svg to the actual container
        container.appendChild(svg.node());
    }

    chart.onMatchSelected = function(callback) {
        onMatchSelectedCallback = callback;
        return chart;
    }
    chart.onRectangleSelected = function(callback) {
        onRectangleSelectedCallback = callback;
        return chart;
    } 
    chart.setSize = function(newHeight) {
        width = newHeight;
        height = newHeight;
        return chart;
    }

    chart.setSelectedMatches = function(newSelectedMatches) {
        selectedMatches = newSelectedMatches;
        return chart;
    }
    chart.setSelectedMatchesObj = function(newSelectedMatches) {
        selectedMatchesObj = newSelectedMatches;
        return chart;
    }
    
    chart.setHoveredFromMatches = function(newHoveredMatches) {
        hoveredMatchesList = newHoveredMatches;
        return chart;
    }

    chart.setHoveredObjFromMatches = function(newHoveredMatches) {
        hoveredMatchesObj = newHoveredMatches;
        return chart;
    }

    chart.setXMin = function(newXMin) {
        xMin = newXMin;
        return chart;
    }
    chart.setXMax = function(newXMax) {
        xMax = newXMax;
        return chart;
    }

    chart.getXYCoords = function() {
        return anglesMap;
    }

    chart.setXYCoords = function(newXYCoords) {
        anglesMap = newXYCoords;
        return chart;
    }

    return chart;
}

//USER INTERACTION FUNCTIONS ------------------------------------------------------------------------

function mouseOverMatch(event, d, svg, radiusScale, centerX, centerY) {
    //get the similarity score
    let simScore = Number.parseFloat(d.similarityScore).toFixed(3);

    //clear the tooltip
    let tooltip = d3.select("#lin-chart-tip")

    tooltip.selectAll("p").remove();

    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .style("visibility", "visible");

    tooltip.append("p")
        .text("Score: " + simScore);

    //create the arc based on the similarity score
    let radius = radiusScale(d.similarityScore);
    let arc = createArc(radius, centerX, centerY);

    //add the arc to the svg
    svg.append("path")
        .attr("d", arc)
        .attr("stroke", determineStroke(d))
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("id", "arc-path-for-hover")
        //the arc needs to be behind the points so that the mouseover event can be handled
        .lower();
    
    //raise the hovered point to the top
    d3.select(event.currentTarget).raise();
}

function mouseOutMatch(event, d, svg, radiusScale, centerX, centerY) {
    //clear the tooltip
    let tooltip = d3.select("#lin-chart-tip")

    tooltip.selectAll("p").remove();
    tooltip.style("visibility", "hidden");

    //remove the arc
    svg.select("#arc-path-for-hover").remove();
}

function clickMatch(event, d, svg, radiusScale, centerX, centerY) {
    //Clear and remove the tooltip but delay it so that the click event can be handled
    setTimeout(function() {
        //clear the tooltip
        let tooltip = d3.select("#lin-chart-tip")
        
        tooltip.selectAll("p").remove();
        tooltip.style("visibility", "hidden");
    }, 100);

    let clickedSvg = d3.select(event.currentTarget); //the svg that was clicked
    let clickedData = d; //the data that was clicked
    let isSelected = clickedSvg.classed("selected-match"); //if the point clicked is already selected (boolean)

    if (isSelected) { //if the point clicked is already selected just deselect it
        clickedSvg
            .classed("selected-match", false)
            .style("stroke", determineStroke(clickedData))
            .attr("fill", determineFill(clickedData));
            
            svg.select("#" + clickedData.id +"-arc").remove(); //remove the arc
    } else {
        //add the selected class to the point
        clickedSvg
            .classed("selected-match", true)
            .raise()
            .style("stroke", determineStroke(clickedData, [clickedData]))
            .attr("fill", determineFill(clickedData, [clickedData]));

        //create the arc based on the similarity score
        let radius = radiusScale(clickedData.similarityScore);
        let arc = createArc(radius, centerX, centerY);
        
        //add the arc to the svg
        svg.append("path")
            .attr("d", arc)
            .attr("stroke", colors.strokeBlue)
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("id", clickedData.id + "-arc")
            //the arc needs to be behind the points so that the mouseover event can be handled
            .lower();
    }
}

//ARC HELPER FUNCTIONS ----------------------------------------------------------------------------------
function generateRandomAngle() {
    //returns a random angle between 2 and 88 degrees
    let angle = 1 + Math.random() * (89 - 1);
    //convert to radians
    angle = angle * Math.PI / 180;
    return angle;
}

function polarToCartesian(r, angle, centerX, centerY) {
    //takes a r value uses the angle and the offsets of the chart to return the x and y coordinates in cartesian space
    var x = centerX + r * Math.cos(angle);
    var y = centerY - r * Math.sin(angle);
    return {x: x, y: y};
}

function createArc(radius, centerX, centerY) {
    //Creates an arc with the radius that is passed in returns the path the start and end are always from 0 to 90 degrees
    let startAngle = 0;
    let endAngle = 90;
    //convert to radians
    startAngle = startAngle * Math.PI / 180;
    endAngle = endAngle * Math.PI / 180;
    //get the start and end points
    let startPoint = polarToCartesian(radius, startAngle, centerX, centerY);
    let endPoint = polarToCartesian(radius, endAngle, centerX, centerY);
    //get the arc sweep
    let arcSweep = endAngle - startAngle <= Math.PI ? "0" : "1";
    //create the path
    let path = [
        "M", startPoint.x, startPoint.y, 
        "A", radius, radius, 0, arcSweep, 0, endPoint.x, endPoint.y
    ].join(" ");
    return path;
}

function createArcSection(innerRadius, outerRadius) {
    let startAngle = 0;
    let endAngle = 90;
    //convert to radians
    startAngle = startAngle * Math.PI / 180;
    endAngle = endAngle * Math.PI / 180;

    let arcSection = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(3);

    return arcSection;
}

//CHART HELPER FUNCTIONS ----------------------------------------------------------------------------------

function createOriginSymbols(svg, marginLeft, height, marginBottom) {
        //Add grey circle to the chart at the origin of the chart
        svg.append("g")
            .append("circle")
            .attr("r", 16)
            .attr("fill", colors.chartLightPurple)
            .attr("stroke", colors.chartMain)
            .attr("stroke-width", 1)
            .attr("transform", `translate(${marginLeft - 20},${(height - marginBottom) + 18})`);

        //Add the person symbol for the patient on the chart
        svg.append("g")
            .append("path")
            .attr("d", "M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z")
            .attr("fill", "purple")
            .attr("transform", `translate(${marginLeft - 35},${(height - marginBottom) + 5}) scale(1.3)`);

        // put a label that says "Patient" under the person symbol
        svg.append("g")
            .append("text")
            .text("Patient")
            .attr("font-size", "11px")
            .attr("fill", "purple")
            .attr("font-weight", "bold")
            .attr("transform", `translate(${marginLeft - 37},${(height - marginBottom) + 44})`);
}

function determineFill(dataPoint, selectedMatches={}, hoveredMatches={}) {
    let color = colors.fillBlack;
    //if they are in hovered maches they will be yellow
    if (hoveredMatches && Object.keys(hoveredMatches).length > 0) {
        if (dataPoint.id in hoveredMatches) {
            return '#E5E900';
        }
    }
    if (selectedMatches && Object.keys(selectedMatches).length > 0) {
        if (dataPoint.id in selectedMatches) {
            return colors.fillBlue;
        }
    } 

    //if they have genes in common stop there
    if (dataPoint.genesInCommon.length > 0) {
        return colors.fillTeal; //teal-blue color
    }
    
    //if not check if they are diagnosed or undiagnosed
    if (dataPoint.dx === 'Undiagnosed') {
        color = colors.fillPurple;
    } else if (dataPoint.dx === 'Diagnosed') {
        color = colors.fillGreen;
    } else {
        color = colors.fillBlack; 
    }

    return color;
}

function determineStroke(dataPoint, selectedMatches={}, hoveredMatches={}) {
    if (selectedMatches && Object.keys(selectedMatches).length > 0) { 
        if (dataPoint.id in selectedMatches) {
            return colors.strokeBlue;
        }
    } 

    //if they have genes in common stop there
    if (dataPoint.genesInCommon.length > 0) {
        return colors.strokeTeal; 
    }
    
    //if not check if they are diagnosed or undiagnosed
    if (dataPoint.dx === 'Undiagnosed') {
        return colors.strokePurple;
    } else if (dataPoint.dx === 'Diagnosed') {
        return colors.strokeGreen;
    } else {
        return colors.strokeBlack; 
    }
}

function determineShape(dataPoint) {
    // Create an SVG element based on the condition
    let symbol = d3.symbol().size(15);

    if (dataPoint.dx === 'Undiagnosed') {
        symbol.type(d3.symbolCircle);
    } else {
        symbol.type(d3.symbolSquare2).size(30);
    }

    if (dataPoint.genesInCommon.length > 0) {
        symbol.size(50);
    }

    return symbol();
}

function determineXY(dataPoint, centerX, centerY, radiusScale, anglesMap) {
    if (anglesMap && dataPoint.id in anglesMap) {
        let angle = anglesMap[dataPoint.id];
        let radius = radiusScale(dataPoint.similarityScore);
        let coords = polarToCartesian(radius, angle, centerX, centerY);
        return {xy: `translate(${coords.x},${coords.y})`, anglesMap: anglesMap}
    } else {
        let angle = generateRandomAngle();
        let radius = radiusScale(dataPoint.similarityScore);

        //get the x and y coordinates
        let coords = polarToCartesian(radius, angle, centerX, centerY);
        //add to anglesMap
        anglesMap[dataPoint.id] = angle;

        //return the path
        return {xy: `translate(${coords.x},${coords.y})`, anglesMap: anglesMap};
    }
}