import * as d3 from "d3";

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

    function chart(container, targetPatient, matchesObj) {
        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", chartId);

        //adjust the x and y axis to allow for the labels
        svg.attr("viewBox", [0, 0, width, height + 10]);

        //put the person mdi at the origin of the chart at the bottom
        svg.append("g")
            .attr("transform", `translate(${marginLeft - 22},${(height - marginBottom) + 3})`)
            .append("foreignObject")
                .attr("width", 28)
                .attr("height", 28)
                .html(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z" fill="purple"/>
                    </svg>
                `)
                .on("mouseover", function(event) {
                    handleMouseOver(event, targetPatient);
                })
                .on("mouseout", function(event) {
                    handleMouseOut(event, targetPatient);
                });

        //put a grey circle under the person
        svg.append("g")
            .attr("transform", `translate(${marginLeft - 8},${(height - marginBottom) + 10})`)
            .append("circle")
                .attr("r", 16)
                .attr("fill", "grey")
                .attr("stroke", "purple")
                .attr("opacity", 0.3);

        // put a label that says "Patient" at the origin of the chart at the bottom
        svg.append("g")
            .attr("transform", `translate(${marginLeft - 5},${(height - marginBottom) + 34})`)
            .append("text")
                .text("Patient")
                .attr("font-size", "10px")
                .attr("fill", "purple");

        //create some x axis ticks by evenly dividing the width of the chart into 5 parts
        // let xTicks = d3.ticks(xMin, xMax, 5);

        //get the max radius
        let maxRadius = (width - marginRight - marginLeft);

        // Create the scaling function
        var radiusScale = d3.scaleLinear()
            .domain([xMin, xMax]) // Input range
            .range([0, maxRadius]); // Output range

        let xTicks = radiusScale.ticks(6);

        //calcluate the center x and y coordinates
        let centerX = marginLeft;
        let centerY = height - marginBottom;
        
        for (let i = 0; i < xTicks.length; i++) {
            let tic = xTicks[i];
            //increase opacity as i increases
            let opacity = 1- ((i+2) * 0.11);
            
            //create the arc based on the tic
            let radius = radiusScale(tic);
            //create a group for the arcSection and the rectangle
            let arcSectionGroup = svg.append("g");
            
            //if we arent at the last element
            if (i < xTicks.length - 1) {
                //create the arc section
                let arcSection = createArcSection(radius, radiusScale(xTicks[i + 1]));

                //add the arc section to the svg
                arcSectionGroup.append("path")
                    .attr("d", arcSection)
                    .attr("stroke", 'white')
                    .attr("stroke-width", 1)
                    .attr("stroke-linecap", "round")
                    .attr("fill", "#996FA7")
                    .attr("class", "arc-section")
                    .attr("opacity", opacity)
                    .attr("transform", `translate(${marginLeft},${height - marginBottom})`)
                    //the arc needs to be behind the points so that the mouseover event can be handled
                    .lower();

                //put a rectangle with rounded edges at the end of the arc on the bottom of the arc
                arcSectionGroup.append("rect")
                        .attr("width", function() {
                            //a function of the with of the arc
                            return radiusScale(xTicks[i + 1]) - radiusScale(tic);
                        })
                        .attr("height", 10)
                        .attr("fill", "#996FA7")
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
                                .attr("fill", "#996FA7")
                                .attr("opacity", opacity);
                            
                            //select the parent then get the first child which is the arc section
                            let arcSection = d3.select(this.parentNode).select(".arc-section");
                            arcSection.attr("fill", "#996FA7")
                        });
            } else if (i === xTicks.length - 1) {
                //create the last which will have the radius and max radius
                let arcSection = createArcSection(radius, maxRadius);
                //add the arc section to the svg
                arcSectionGroup.append("path")
                    .attr("d", arcSection)
                    .attr("stroke", 'white')
                    .attr("stroke-width", 1)
                    .attr("stroke-linecap", "round")
                    .attr("fill", "#996FA7")
                    .attr("class", "arc-section")
                    .attr("opacity", opacity)
                    .attr("transform", `translate(${marginLeft},${height - marginBottom})`)
                    //the arc needs to be behind the points so that the mouseover event can be handled
                    .lower();

                //put a rectangle with rounded edges at the end of the arc on the bottom of the chart
                arcSectionGroup.append("rect")
                        .attr("width", function() {
                            //a function of the with of the arc
                            return maxRadius - radiusScale(tic);
                        })
                        .attr("height", 10)
                        .attr("fill", "#996FA7")
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

                            //select the parent then get the first child which is the arc section
                            let arcSection = d3.select(this.parentNode).select(".arc-section");
                            arcSection.attr("fill", "purple")
                        })
                        .on("mouseout", function(event) {
                            //change back to its original color
                            d3.select(this)
                                .attr("fill", "#996FA7")
                                .attr("opacity", opacity);

                            //select the parent then get the first child which is the arc section
                            let arcSection = d3.select(this.parentNode).select(".arc-section");
                            arcSection.attr("fill", "#996FA7")
                        });
            }   
        }
        //for each tic add a label
        svg.append("g")
            .selectAll("text")
            .data(xTicks)
            .join("text")
                .text(function(d) {
                    return d;
                })
                .attr("x", function(d) {
                    let radius = radiusScale(d);
                    let coords = polarToCartesian(radius, 0, centerX, centerY);
                    return coords.x;
                })
                .attr("y", height - marginBottom + 18)
                .attr("font-size", "10px")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("fill", "#5F5661");

        if (matchesObj) {
            //make a group for all the matches
            let matches = svg.append("g")
            let matchesArray = Object.values(matchesObj);

            //put all the MATCHES on the chart
            matches.append("g")
                .selectAll("matches")
                .data(matchesArray)
                .enter()
                .append("path")
                .attr("d", function(d) {
                    // Create an SVG element based on the condition
                    let symbol = d3.symbol()
                        .size(15);
                    if (d.dx === 'undiagnosed') { // Replace 'sharesGenes' with your actual condition
                        symbol.type(d3.symbolCircle);
                    } else {
                        symbol.type(d3.symbolSquare2).size(30);
                    }
                    if (d.genesInCommon.length > 0) {
                        symbol.size(50);
                    }
                    return symbol();
                })
                .attr("transform", function(d) {
                    //get the angle
                    let angle = generateRandomAngle();
                    //get the radius
                    let radius = radiusScale(d.similarityScore);
                    //calcluate the center x and y coordinates
                    let centerX = marginLeft;
                    let centerY = height - marginBottom;
                    //get the x and y coordinates
                    let coords = polarToCartesian(radius, angle, centerX, centerY);
                    //return the path
                    return `translate(${coords.x},${coords.y})`;
                })
                .classed("selected-match", function(d) {
                    if (selectedMatch && d.id === selectedMatch.id) {
                        return true;
                    } else {
                        return false;
                    }
                })
                .attr("fill", function(d) {
                    if (d.genesInCommon.length > 0) {
                        return "#33DDFF";
                    } else if (d.dx === 'diagnosed') {
                       return "#18F218"
                    } else if (d.dx === 'undiagnosed') {
                        return "#D765FC";
                    } else {
                        return "black";
                    }
                })
                .attr("stroke", function(d) {
                    if (d.genesInCommon.length > 0) {
                        return "#007991";
                    }

                    if (selectedMatch && d.id === selectedMatch.id) {
                        if (d.genesInCommon.length > 0) {
                            return "#CBD10A";
                        }

                        if (d.dx === 'undiagnosed') {
                            return "#8A05B6";
                        } else if (d.dx === 'diagnosed') {
                                return "#099509";
                        }
                    } else if (d.dx === 'undiagnosed') {
                        return "#8A05B6";
                    } else if (d.dx === 'diagnosed') {
                            return "#099509";
                    } else {
                        return "black";
                    }
                })
                .attr("stroke-width", 1.5)
                .on("mouseover", function(event, d) {
                    let size = 2 + (d.similarityScore * 7);
                    d3.select(this)
                        .attr("stroke-width", 1.5);
                    handleMouseOver(event, d);
                })
                .on("mouseout", function(event, d) {
                    //make the circle smaller
                    d3.select(this)
                        .attr("stroke-width", function(d) {
                            let size = 4 + (d.similarityScore * 7);

                            if (selectedMatch && d.id === selectedMatch.id) {
                                return 1.5;
                            } else {
                                return 1.5;
                            }
                        });
                    handleMouseOut(event, d);
                })
                .on("click", function(event, d) {
                    handleClick(event, d);
                }).raise();

            //if there is a selected match add the arc
            if (selectedMatch) {
                //calcluate the center x and y coordinates
                let centerX = marginLeft;
                let centerY = height - marginBottom;

                //create the arc based on the similarity score
                let radius = radiusScale(selectedMatch.similarityScore);
                let arc = createArc(radius, centerX, centerY);

                let dxValue = selectedMatch.dx;
                let genesInCommon = selectedMatch.genesInCommon;
                //add the arc to the svg
                svg.append("path")
                    .attr("d", arc)
                    .attr("stroke", function(d) {
                        return "#3855A5"
                    })
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
                    .attr("id", "arc-path-for-selected")
                    //the arc needs to be behind the points so that the mouseover event can be handled
                    .lower();
            }
        }

        function handleMouseOver(event, d) {
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

            //calcluate the center x and y coordinates
            let centerX = marginLeft;
            let centerY = height - marginBottom;

            //create the arc based on the similarity score
            let radius = radiusScale(d.similarityScore);
            let arc = createArc(radius, centerX, centerY);

            let dxValue = d.dx;
            let genesInCommon = d.genesInCommon;
            //add the arc to the svg
            svg.append("path")
                .attr("d", arc)
                .attr("stroke", function(d) {
                    if (genesInCommon.length > 0) {
                        return "#007991";
                    }
                    if (dxValue === 'undiagnosed') {
                        return "#8A05B6";
                    } else if (dxValue === 'diagnosed') {
                            return "#099509";
                    } else {
                        return "black";
                    }
                })
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .attr("id", "arc-path-for-hover")
                //the arc needs to be behind the points so that the mouseover event can be handled
                .lower();
            
            //raise the hovered point to the top
            d3.select(event.currentTarget).raise();
        }
        function handleMouseOut(event, d) {
            //clear and hide the tooltip
            d3.select("#lin-chart-tip")
                .selectAll("p").remove();

            d3.select("#lin-chart-tip")
                .style("visibility", "hidden");

            //remove the arc
            svg.select("#arc-path-for-hover").remove();
        }

        function handleClick(event, d) {
            //Clear and remove the tooltip but delay it so that the click event can be handled
            setTimeout(function() {
                d3.select("#lin-chart-tip")
                    .selectAll("p").remove();

                d3.select("#lin-chart-tip")
                    .style("visibility", "hidden");
            }, 100);

            let point = d3.select(event.currentTarget);
            let selected = point.classed("selected-match");

            //if classes contains selected, remove it
            if (selected) {
                //Get any already selected points and set them back to default style
                d3.select(".selected-match")
                    .style("stroke", function(d) {
                        if (d.dx === 'diagnosed') {
                            return "#099509";
                        } else if (d.dx === 'undiagnosed') {
                            return "#8A05B6";
                        } else {
                            return "black";
                        }
                    })
                    .style("stroke-width", function(d) {
                        let size = 4 + (d.similarityScore * 7);
                        
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return 1.5;
                        } else {
                            return 1.5;
                        }
                    })
                    .classed("selected-match", false);

                    svg.select("#arc-path-for-selected").remove();

            } else {
                //Get any already selected points and set them back to default style
                d3.select(".selected-match")
                    .style("stroke", function(d) {
                        if (d.dx === 'diagnosed') {
                            return "#099509";
                        } else if (d.dx === 'undiagnosed') {
                            return "#8A05B6";
                        } else {
                            return "black";
                        }
                    })
                    .style("stroke-width", function(d) {
                        let size = 4 + (d.similarityScore * 7);
                        
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return 1.5;
                        } else {
                            return 1.5;
                        }
                    })
                    .classed("selected-match", false);
                //delete the arc
                svg.select("#arc-path-for-selected").remove();

                //add the selected class to the point
                point.classed("selected-match", true);

                d3.select(".selected-match")
                    .raise()
                    .style("stroke", function(d) {
                        return "#3855A5"
                    })
                    .style("stroke-width", function(d) {
                        let size = 4 + (d.similarityScore * 7);
                        
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return 1.5;
                        } else {
                            return 1.5;
                        }
                    });
                
                //calcluate the center x and y coordinates
                let centerX = marginLeft;
                let centerY = height - marginBottom;

                //create the arc based on the similarity score
                let radius = radiusScale(d.similarityScore);
                let arc = createArc(radius, centerX, centerY);
                
                let dxValue = d.dx;
                let genesInCommon = d.genesInCommon;
                //add the arc to the svg
                svg.append("path")
                    .attr("d", arc)
                    .attr("stroke", function(d) {
                        return "#3855A5"
                    })
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
                    .attr("id", "arc-path-for-selected")
                    //the arc needs to be behind the points so that the mouseover event can be handled
                    .lower();
            }
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
