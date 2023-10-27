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

    function chart(container, targetPatient, matchesObj) {
        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", chartId);

        // Create the x scale.
        const x = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([marginLeft, width - marginRight]);
        
        // Create the x axis.
        const xAxis = g => g
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        
        // Add the x axis to the svg.
        svg.append("g")
            .call(xAxis);

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

        if (targetPatient && targetPatient.similarityScore) {
            // Put the target patient as a dot on the origin of the chart at the bottom.
            // let targetPoint = svg.append("g")
            //     .attr("transform", `translate(${x(targetPatient.similarityScore)},${height - marginBottom})`);
            // targetPoint.append("circle")
            //     .attr("r", 4)
            //     .attr("fill", "red");

            // Put the target patient as a person mdi on the origin of the chart at the bottom.
            var targetPoint = svg.append("g")
            .attr("transform", `translate(${x(targetPatient.similarityScore) - 12},${(height - marginBottom) - 24})`);

            targetPoint.append("foreignObject")
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
        }

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
                    .attr("stroke", function(d) {
                        if (d.dx === 'diagnosed') {
                            return "green";
                        } else if (d.dx === 'undiagnosed') {
                            return "blue";
                        } else {
                            return "black";
                        }
                    })
                    .attr("stroke-width", 6)
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
                            .attr("stroke-width", 6);
                        handleMouseOut(event, d);
                    })
                    .on("click", function(event, d) {
                        handleClick(event, d);
                    });
        }

        function handleMouseOver(event, d) {
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
            //remove the tooltip
            d3.select("#lin-chart-tip")
                .selectAll("p")
                .remove();
            d3.select("#lin-chart-tip")
                .style("visibility", "hidden");
        }

        function handleClick(event, d) {
            let point = d3.select(event.currentTarget);
            let classes = point.attr("class");

            //if classes contains selected, remove it
            if (classes && point.attr("class").includes("selected-match")) {
                point.classed("selected-match", false);
            } else {
                //clear any other selected points
                d3.selectAll("path").classed("selected-match", false);
                //add the selected class to the point
                point.classed("selected-match", true);
            }

            //Get the tooltip and hide it
            d3.select("#lin-chart-tip").style("visibility", "hidden");
        }

        //Add the svg to the actual container
        container.appendChild(svg.node());
    }

    chart.setWidth = function(newWidth) {
        width = newWidth;
        return chart;
    }

    return chart;
}