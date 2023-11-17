import * as d3 from "d3";

//Setting colors for organization
const colors = {
    "strokeGreen": "#099509",
    "fillGreen": "#18F218",
    "strokePurple": "#8A05B6",
    "fillPurple": "#D765FC",
    "strokeBlack": "black",
    "fillBlack": "black",
    "strokeTeal": "#007991",
    "fillTeal": "#33DDFF",
    "strokeBlue": "#3855A5",
    "fillBlue": "#3855A5",

    "targetPurple": "purple",
    "chartMain": "#996FA7",
    "chartLettersGrey": "#5F5661",
    "chartLightPurple": "#DCCFDD",
}

export default function CircularChart() {

    var width = 600;
    var height = 300;

    var xMin = 1;
    var xMax = 0;

    var marginRight = 30;
    var marginBottom = 30;
    var marginLeft = 30;
    var chartId = "CircularChartD3";

    var selectedMatch = null;

    function chart(container, matchesObj) {
        // Create the SVG
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", chartId);

        svg.attr("viewBox", [0, 0, width, height + 10]); //ViewBox

        //Create the chart origin and the patient symbol
        createOriginSymbols(svg, marginLeft, height, marginBottom);

        //Set max radius
        let maxRadius = (width - marginRight - marginLeft); 

        //Scaling function: scales similarity scores based on the max radius
        var radiusScale = d3.scaleLinear()
            .domain([xMin, xMax]) // Input range
            .range([0, maxRadius]); // Output range
        
        //Calcluate the center x and y coordinate
        var centerX = marginLeft;
        var centerY = height - marginBottom;

        let xTicks = radiusScale.ticks(6);
  
        for (let i = 0; i < xTicks.length; i++) {
            let tic = xTicks[i];
            //create the arc based on the tic
            var radius = radiusScale(tic);

            if (i < xTicks.length - 1) {
                var nextRadius = radiusScale(xTicks[i + 1]);
            } else {
                var nextRadius = maxRadius; //the last tic should be the max radius
            }

            //increase opacity as i increases
            let opacity = 1- ((i+2) * 0.11);

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
            arcSectionGroup.append("rect")
                .attr("width", nextRadius - radius)
                .attr("height", 10)
                .attr("fill", colors.chartMain)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("stroke", "white")
                .attr("opacity", opacity)
                .attr("cursor", "pointer")
                .attr("transform", `translate(${marginLeft + radius},${height - marginBottom})`)
                .on("mouseover", function(event) {
                    //change the color to purple
                    d3.select(this)
                        .attr("fill", "purple")
                        .attr("opacity", 1);

                    //select the parent then get the first child 
                    let arcSection = d3.select(this.parentNode).select(".arc-section");
                    arcSection.attr("fill", "purple")
                })
                .on("mouseout", function(event) {
                    //change back to its original color
                    d3.select(this)
                        .attr("fill", colors.chartMain)
                        .attr("opacity", opacity);
                    
                    //select the parent then get the first child which is the arc section
                    let arcSection = d3.select(this.parentNode).select(".arc-section");
                    arcSection.attr("fill", colors.chartMain)
                }); 
        }

        //Tic Labels
        svg.append("g")
            .selectAll("text")
            .data(xTicks)
            .join("text")
                .text(function(d) {
                    return d;
                })
                .attr("x", function(d) {
                    let coords = polarToCartesian(radiusScale(d), 0, centerX, centerY);
                    return coords.x;
                })
                .attr("y", height - marginBottom + 18)
                .attr("font-size", "10px")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("fill", colors.chartLettersGrey);
        
        //In case there are no matches return
        if (!matchesObj) {
            return;
        }

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
            .attr("transform", d => determineXY(d, centerX, centerY, radiusScale))
            .classed("selected-match", d => selectedMatch && (d.id === selectedMatch.id) ? true : false)
            .attr("fill", d => determineFill(d, selectedMatch))
            .attr("stroke", d => determineStroke(d, selectedMatch))
            .attr("stroke-width", 1.5)
            .on("mouseover", function(event, d) {
                mouseOverMatch(event, d, svg, radiusScale, centerX, centerY);
            })
            .on("mouseout", function(event, d) {
                mouseOutMatch(event, d, svg, radiusScale, centerX, centerY);
            })
            .on("click", function(event, d) {
                clickMatch(event, d, svg, radiusScale, centerX, centerY);
            }).raise();

        //if there is a selected match add the arc
        if (selectedMatch) {
            //create the arc based on the similarity score
            let radius = radiusScale(selectedMatch.similarityScore);
            let arc = createArc(radius, centerX, centerY);

            //add the arc to the svg
            svg.append("path")
                .attr("d", arc)
                .attr("stroke", colors.strokeBlue)
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .attr("id", "arc-path-for-selected")
                //the arc needs to be behind the points so that the mouseover event can be handled
                .lower();
        }

        //Add the svg to the actual container
        container.appendChild(svg.node());
    }

    chart.setWidth = function(newWidth) {
        width = newWidth;
        return chart;
    }

    chart.setHeight = function(newHeight) {
        height = newHeight;
        return chart;
    }

    chart.setSelectedMatch = function(newSelectedMatch) {
        selectedMatch = newSelectedMatch;
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

    return chart;
}

function mouseOverMatch(event, d, svg, radiusScale, centerX, centerY) {
    //clear and remove the tooltip
    d3.select("#lin-chart-tip")
        .selectAll("p").remove();
    d3.select("#lin-chart-tip")
        .style("visibility", "hidden");

    //make a tooltip
    let tooltip = d3.select("#lin-chart-tip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .style("visibility", "visible");

    //add the similarity score
    let simScore = d.similarityScore;

    //make into a num round and then a string
    simScore = Number.parseFloat(simScore).toFixed(3);
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
    //clear and hide the tooltip
    d3.select("#lin-chart-tip")
        .selectAll("p").remove();

    d3.select("#lin-chart-tip")
        .style("visibility", "hidden");

    //remove the arc
    svg.select("#arc-path-for-hover").remove();
}

function clickMatch(event, d, svg, radiusScale, centerX, centerY) {
    //Clear and remove the tooltip but delay it so that the click event can be handled
    setTimeout(function() {
        d3.select("#lin-chart-tip")
            .selectAll("p").remove();

        d3.select("#lin-chart-tip")
            .style("visibility", "hidden");
    }, 100);

    let clickedSvg = d3.select(event.currentTarget);
    let clickedData = d;
    let isSelected = clickedSvg.classed("selected-match");

    if (isSelected) { //if the point clicked is already selected just deselect it
        clickedSvg
            .style("stroke", determineStroke(clickedData))
            .attr("fill", determineFill(clickedData))
            .classed("selected-match", false);

            svg.select("#arc-path-for-selected").remove(); //remove the arc
    } else {
        //Get any already selected points and set them back to default style
        let previouslySelected = d3.selectAll(".selected-match")
        if (!previouslySelected.empty()){
            previouslySelected.each(function(d) {
                d3.select(this)
                    .style("stroke", determineStroke(d))
                    .attr("fill", determineFill(d))
                    .classed("selected-match", false);
            });
            //delete the arc
            svg.select("#arc-path-for-selected").remove();
        }

        //add the selected class to the point
        clickedSvg.classed("selected-match", true);

        d3.select(".selected-match")
            .raise()
            .style("stroke", determineStroke(clickedData, clickedData))
            .attr("fill", determineFill(clickedData, clickedData));

        //create the arc based on the similarity score
        let radius = radiusScale(clickedData.similarityScore);
        let arc = createArc(radius, centerX, centerY);
        
        //add the arc to the svg
        svg.append("path")
            .attr("d", arc)
            .attr("stroke", colors.strokeBlue)
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("id", "arc-path-for-selected")
            //the arc needs to be behind the points so that the mouseover event can be handled
            .lower();
    }
}

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
        .cornerRadius(5);

    return arcSection;
}

function createOriginSymbols(svg, marginLeft, height, marginBottom) {
        //Add grey circle to the chart at the origin of the chart
        svg.append("g")
            .append("circle")
            .attr("r", 16)
            .attr("fill", colors.chartLightPurple)
            .attr("stroke", colors.chartMain)
            .attr("stroke-width", 1)
            .attr("transform", `translate(${marginLeft - 8},${(height - marginBottom) + 8})`);

        //Add the person symbol for the patient on the chart
        svg.append("g")
            .append("path")
            .attr("d", "M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z")
            .attr("fill", "purple")
            .attr("transform", `translate(${marginLeft - 23},${(height - marginBottom) - 5}) scale(1.3)`);

        // put a label that says "Patient" under the person symbol
        svg.append("g")
            .append("text")
            .text("Patient")
            .attr("font-size", "11px")
            .attr("fill", "purple")
            .attr("font-weight", "bold")
            .attr("transform", `translate(${marginLeft - 25},${(height - marginBottom) + 36})`);
}

function determineFill(dataPoint, selectedMatch=null) {
    if (selectedMatch != null) { //if there is a selected match
        //if they are the selected match fill them blue
        if (dataPoint.id === selectedMatch.id) {
            return colors.fillBlue;
        }
    } 

    //if they have genes in common stop there
    if (dataPoint.genesInCommon.length > 0) {
        return colors.fillTeal; //teal-blue color
    }
    
    //if not check if they are diagnosed or undiagnosed
    if (dataPoint.dx === 'undiagnosed') {
        return colors.fillPurple;
    } else if (dataPoint.dx === 'diagnosed') {
        return colors.fillGreen;
    } else {
        return colors.fillBlack; 
    }
}

function determineStroke(dataPoint, selectedMatch=null) {
    if (selectedMatch != null) {
        //if they are the selected match fill them blue
        if (dataPoint.id === selectedMatch.id) {
            return colors.strokeBlue;
        }
    }

    //if they have genes in common stop there
    if (dataPoint.genesInCommon.length > 0) {
        return colors.strokeTeal; 
    }
    
    //if not check if they are diagnosed or undiagnosed
    if (dataPoint.dx === 'undiagnosed') {
        return colors.strokePurple;
    } else if (dataPoint.dx === 'diagnosed') {
        return colors.strokeGreen;
    } else {
        return colors.strokeBlack; 
    }
}

function determineShape(dataPoint) {
    // Create an SVG element based on the condition
    let symbol = d3.symbol().size(15);

    if (dataPoint.dx === 'undiagnosed') {
        symbol.type(d3.symbolCircle);
    } else {
        symbol.type(d3.symbolSquare2).size(30);
    }

    if (dataPoint.genesInCommon.length > 0) {
        symbol.size(50);
    }

    return symbol();
}

function determineXY(dataPoint, centerX, centerY, radiusScale) {
    //get the angle
    let angle = generateRandomAngle();
    //get the radius
    let radius = radiusScale(dataPoint.similarityScore);
    //get the x and y coordinates
    let coords = polarToCartesian(radius, angle, centerX, centerY);
    //return the path
    return `translate(${coords.x},${coords.y})`;
}