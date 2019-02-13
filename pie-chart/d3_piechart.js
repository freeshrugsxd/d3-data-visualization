function draw_pie(config) {

    let divId      = config.div_id,
        chartId    = config.chart_id,
        margin     = config.margin,
        w          = $(divId).width(),
        showLegend = config.legend;

    // save first level data as new attribute
    if (config.currentLevel === 0 && config.og === undefined) {
        config.og = config.data
    }

    $(divId).html('') // delete all content of div container

    if (showLegend) {
        margin.right = 200
    }

    let colorrange = d3.range(10)
        .map(d3.scale.category20());

    let color = d3.scale.ordinal()
        .range(colorrange);


// --------------------------------------------------------- //
//  PIE CHART
// --------------------------------------------------------- //

    let outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius   = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    let pie = d3.layout.pie()
        .sort(null)
        .value(d => d.value);

    let arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // bigger outerRadius for mouseover transition
    let arcMouseOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.02);

    // create svg area
    let svg = d3.selectAll(divId)
        .append('svg')
        .attr({id : chartId, width : w, height : h})
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    let pieData = pie(config.data)

    // append group for each datum in config.data
    let arcs = svg.selectAll('.arc')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('transform', `translate(${outerRadius}, ${outerRadius})`);

    // generate pie slices
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .style('stroke', 'white')
        // grow on mouseover
        .on('mouseover', function(){
            d3.select(this)
                .transition()
                    .duration(125)
                    .ease('in')
                    .attr('d', arcMouseOver)
        })
        // back to normal on mouseout
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                    .ease('out')
                    .delay(100)
                    .duration(150)
                    .attr('d', arc)
        })
        // back to normal when left button is pressed
        .on('mousedown', function() {
            d3.select(this)
                .transition()
                    .ease('bounce')
                    .attr('d', arc)
        })
        // grow back to mouseover size on mouseup when on deepest level
        .on('mouseup', function() {
            let children = this.__data__.data[config.inner];
            if (children === undefined) {
                d3.select(this)
                    .transition()
                        .ease('out')
                        .duration(150)
                        .attr('d', arcMouseOver)
            }
        })
        // drill down one level on click
        .on('click', function() {
            // check for child nodes and set them as config.data
            let children = this.__data__.data[config.inner];
            if (children !== undefined) {
                config.data = children;
                config.currentLevel++
                config.history.push(children)
                config.goingUp = false
                draw_pie(config)
            }
        });

    // create the labels at the center of the pie slices
    // arcs.append('text')
    //     .attr('transform', d => `translate(${arc.centroid(d)})`)
    //     .text(d => `${d.data.label} (${d.value})`)
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', '14px');


// --------------------------------------------------------- //
//  UP BUTTON
// --------------------------------------------------------- //

    let upBtn = svg.append('g')
        .attr('class', 'upButton');

    // determine the initial radius based on current level and direction
    let rad   = outerRadius / 6,
        rInit = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

    let circ = upBtn.append('circle')
        .attr('r', rInit)
        .attr('transform', `translate(${outerRadius * 2}, 0)`)
        .attr('fill', 'green')
        .on('mouseover', function() {
            // disable mouseover transitions on root level because
            // it otherwise interferes with other transitions
            if (config.currentLevel > 0)
                d3.select(this)
                    .transition()
                        .duration(125)
                        .ease('in')
                        .attr('r', rad * 1.05)
        })
        .on('mouseout', function() {
            if (config.currentLevel > 0)
                d3.select(this)
                    .transition()
                        .ease('out')
                        .delay(100)
                        .duration(150)
                        .attr('r', rad)
        })
        .on('mousedown', function() {
            if (config.currentLevel > 0) {
                d3.select(this)
                    .transition()
                        .ease('bounce')
                        .attr('r', rad * 0.95)
            }
        })
        .on('click', function() {
            // check if parent layer is root
            if (config.history[config.currentLevel - 2] !== undefined) {
                config.data = config.history[--config.currentLevel - 1]
                config.history.pop()
                config.goingUp = true
                draw_pie(config)
            }
            else if (config.currentLevel == 1) {
                config.data = config.og
                config.currentLevel--
                config.history.pop()
                config.goingUp = true
                draw_pie(config)
            }
        });
        // conditional transitions on up-button
        if (config.currentLevel == 1) {
            circ.transition()
                .ease('bounce')
                .duration(500)
                .attr('r', rad)
        }
        else if (config.currentLevel == 0){
            circ.transition()
                .delay(150)
                .ease('out')
                .attr('r', 0)
            // set to false so rezising on root level won't trigger transition
            config.goingUp = false
        }


// --------------------------------------------------------- //
//  LEGEND
// --------------------------------------------------------- //

    let spacing  =  5,  // space between legend entries
        rectSize = 16,  // height of legend entry rectangle
        scaling  =  1;  // intitial scale factor

    // feed legend current pie data
    let legend = svg.selectAll('.legend')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {

            // is the legend higher than the svg, scale its content
            if ((rectSize + spacing) * pieData.length >= h) {

                // determine scaling based on svg height, rectangle height and offset
                scaling  = (h - spacing) / ((rectSize + spacing) * pieData.length)
                rectSize = rectSize * scaling
                spacing  = spacing  * scaling

            }

            // declaring height and offset before if clause causes weird behaviour
            let height = rectSize + spacing,  // height of legend entry rectangle
                offset = height * pieData.length  // height of the legend
                dx = w - margin.right + rectSize,
                dy = (outerRadius - offset / 2) + i * height + spacing;

            return `translate(${dx}, ${dy})`

        });

    let attrs = {
        width : rectSize,
       height : rectSize,
         fill : (d, i) => color(i),
       stroke : (d, i) => color(i)
    };

    legend.append('rect')
        .attr(attrs)

    legend.append('text')
        .style("font-size", function() {
            let fontSize = Math.round(10 * scaling)
            return `${fontSize}px`
        })
        .style("font-weight", "bold")
        .attr('x', attrs.width + spacing)
        .attr('y', (attrs.height + 2 * spacing) / 2)
        .text(d => `${d.data.label}`)

    legend.on('mouseover', function(d, i) {
        key = d.key
        // console.log('d', d)
        svg.selectAll('.legend')
            .transition()
                .duration(250)
                .attr('opacity', d => key != d.key ? 0.6 : 1)
        })

    console.log(legend)

// --------------------------------------------------------- //
//  TOOLTIP
// --------------------------------------------------------- //

}
