import * as d3 from "d3";

export default function LinearChart() {

    var width = 600;
    var height = 300;

    var xMin = 1;
    var xMax = 0;
    var yMin = 0;
    var yMax = 5;

    var marginTop = 20;
    var marginRight = 20;
    var marginBottom = 30;
    var marginLeft = 40;
    var chartId = "LinearChartD3";

    var selectedMatch = null;

    function chart(container, targetPatient, matchesObj) {
        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", chartId);

        // Create the x scale.
        const x = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([marginLeft + 20, width - marginRight]);
        
        // Create the x axis.
        const xAxis = g => g
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        
        // Add the x axis to the svg.
        svg.append("g")
            .call(xAxis);

        // x axis label
        svg.append("text")
            .attr("transform", `translate(${width / 2},${height + 2})`)
            .style("text-anchor", "middle")
            .style("font-size", "13px")
            .text("Similarity Score");

        // Create the y scale.
        const y = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height - marginBottom, marginTop]);

        let tickValues = d3.range(yMin, yMax + 1);

        // Create the y axis.
        const yAxis = g => g
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).tickValues(tickValues))
            .call(g => g.select(".domain").remove());

        // Add the y axis to the svg.
        svg.append("g")
            .call(yAxis);

        // y axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", ".75em")
            .style("text-anchor", "middle")
            .style("font-size", "13px")
            .text("Number of Genes in Common");

        //adjust the x and y axis to allow for the labels
        svg.attr("viewBox", [0, 0, width, height + 10]);


        // if (targetPatient && targetPatient.similarityScore) {
        //     // Put the target patient as a person mdi on the origin of the chart at the bottom.
        //     var targetPoint = svg.append("g")
        //     .attr("transform", `translate(${x(targetPatient.similarityScore) - 12},${(height - marginBottom) - 24})`);

        //     targetPoint.append("foreignObject")
        //         .attr("width", 24)
        //         .attr("height", 24)
        //         .html(`
        //             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        //                 <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z" fill="red"/>
        //             </svg>
        //         `)
        //         .on("mouseover", function(event) {
        //             handleMouseOver(event, targetPatient);
        //         })
        //         .on("mouseout", function(event) {
        //             handleMouseOut(event, targetPatient);
        //         });
        // }

        //put a vertical line at the origin of the chart that is slightly longer than the Y axis on both top and bottom
        svg.append("g")
            .append("path")
                .attr("d", d => `
                    M ${marginLeft},${marginTop}
                    L ${marginLeft},${height - marginBottom}
                `)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-linecap", "square");

        //put the person mdi at the origin of the chart at the bottom
        svg.append("g")
            .attr("transform", `translate(${marginLeft - 12},${(height - marginBottom) + 1})`)
            .append("foreignObject")
                .attr("width", 24)
                .attr("height", 24)
                .html(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z" fill="red"/>
                    </svg>
                `)
                .on("mouseover", function(event) {
                    handleMouseOver(event, targetPatient);
                })
                .on("mouseout", function(event) {
                    handleMouseOut(event, targetPatient);
                });

        // put a label that says "Target Patient" at the origin of the chart at the bottom
        svg.append("g")
            .attr("transform", `translate(${marginLeft + 4},${(height - marginBottom) + 30})`)
            .append("text")
                .text("Target Patient")
                .attr("font-size", "10px")
                .attr("fill", "red");

        if (matchesObj) {
            //make a group for all the matches
            let matches = svg.append("g")
            let matchesArray = Object.values(matchesObj);
            
            //put all the matches on the line according to their similarity score property which is at index 1 of the tuple make them circles with radius 4 blue
            matches.append("g")
                .selectAll("path")
                .data(matchesArray)
                .join("path")
                    .attr("d", d => `
                        M ${x(d.similarityScore)},${y(d.genesInCommon.length)}
                        L ${x(d.similarityScore)},${y(d.genesInCommon.length)}
                    `)
                    .classed("selected-match", function(d) {
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return true;
                        } else {
                            return false;
                        }
                    })
                    .attr("stroke", function(d) {
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return "red";
                        } else if (d.dx === 'undiagnosed') {
                            return "blue";
                        } else if (d.dx === 'diagnosed') {
                                return "green";
                        } else {
                            return "black";
                        }
                    })
                    .attr("stroke-width", function(d) {
                        if (selectedMatch && d.id === selectedMatch.id) {
                            return 10;
                        } else {
                            return 6;
                        }
                    })
                    .attr("stroke-linecap", "round")
                    .on("mouseover", function(event, d) {
                        //make the circle bigger
                        d3.select(this)
                            .attr("stroke-width", 10);
                        handleMouseOver(event, d);
                    })
                    .on("mouseout", function(event, d) {
                        //make the circle smaller
                        d3.select(this)
                            .attr("stroke-width", function(d) {
                                if (selectedMatch && d.id === selectedMatch.id) {
                                    return 10;
                                } else {
                                    return 6;
                                }
                            });
                        handleMouseOut(event, d);
                    })
                    .on("click", function(event, d) {
                        handleClick(event, d);
                    });
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
            //add the patient id
            tooltip.append("p")
                .text("Patient ID: " + d.id);
            //add the similarity score
            tooltip.append("p")
                .text("Similarity Score: " + d.similarityScore);
            //add the number of genes in common
            if (d.genesInCommon) {
                tooltip.append("p")
                .text("Number of Genes in Common: " + d.genesInCommon.length);

                if (d.genesInCommon.length > 0) {
                    //add the genes in common
                    tooltip.append("p")
                        .text("Genes in Common: " + d.genesInCommon.join(", "));
                }
            }


        }
        function handleMouseOut(event, d) {
            //clear and hide the tooltip
            d3.select("#lin-chart-tip")
                .selectAll("p").remove();

            d3.select("#lin-chart-tip")
                .style("visibility", "hidden");
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
                            return "green";
                        } else if (d.dx === 'undiagnosed') {
                            return "blue";
                        } else {
                            return "black";
                        }
                    })
                    .style("stroke-width", 6)
                    .classed("selected-match", false);

            } else {
                //Get any already selected points and set them back to default style
                d3.select(".selected-match")
                .style("stroke", function(d) {
                    if (d.dx === 'diagnosed') {
                        return "green";
                    } else if (d.dx === 'undiagnosed') {
                        return "blue";
                    } else {
                        return "black";
                    }
                })
                .style("stroke-width", 6)
                .classed("selected-match", false);

                //add the selected class to the point
                point.classed("selected-match", true);

                d3.select(".selected-match")
                .raise()
                .style("stroke", "red")
                .style("stroke-width", 10);
            }
        }

        //Add the svg to the actual container
        container.appendChild(svg.node());
    }

    chart.setWidth = function(newWidth) {
        width = newWidth;
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
    chart.setYMin = function(newYMin) {
        yMin = newYMin;
        return chart;
    }
    chart.setYMax = function(newYMax) {
        yMax = newYMax;
        return chart;
    }

    return chart;
}