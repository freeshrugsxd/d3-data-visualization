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

    // x and y coords of the pie chart centre
    let cx = outerRadius + margin.left,
        cy = outerRadius + margin.top;

    // create svg area
    let svg = d3.selectAll(divId)
        .append('svg')
        .attr({id : chartId, width : w, height : h})
        .append('g')
        .attr('transform', `translate(${cx}, ${cy})`);

    let pieData = pie(config.data)
    // append group for each datum in config.data
    let arcs = svg.selectAll('.arc')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'arc');

    // generate the pie slices
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .style('stroke', 'white')
        // .style('stroke-width', '1px')
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
        // grow back to mouseover size on mouseup when in deepest level
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
    let rad = outerRadius / 6,
        rInit = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

    let circ = upBtn.append('circle')
        .attr('r', rInit)
        .attr('transform',
              `translate(${outerRadius}, ${- outerRadius})`)
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


    let spacing  =  5,
        rectSize = 20;

    // feed legend current pie data
    let legend = svg.selectAll('.legend')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            let height = rectSize + spacing,
                offset = height * pieData.length,
                dx     = w / 3 + rectSize,
                dy     = Math.min(i * height - offset / 2, h / 2)
            return `translate(${dx}, ${dy})`;
        });

    let attrs = {
        width : rectSize * 2,
       height : rectSize,
         fill : (d, i) => color(i)
    };

    legend.append('rect')
        .attr(attrs)

    legend.append('text')
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .attr('x', rectSize * 2.1)
        .attr('y', rectSize * 0.75)
        .text(d => `${d.data.label}`)

    legend.on('mouseover', function(d, i) {
        key = d.key
        console.log('d', d)
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
