function draw_pie(config) {

    let ref_width   = config.ref_width,
        ref_height  = config.ref_height,
        min_width   = config.min_width,
        min_height  = config.min_height,
        containerId = config.containerId,

        layer_class  = `layer_${containerId}`,
        legend_class = `legend_${containerId}`,
        button_class = `up_btn_${containerId}`,
        rect_class   = `rect_${containerId}`,

        chart_class_sel  = `.${containerId}`,
        layer_class_sel  = `.${layer_class}`,
        legend_class_sel = `.${legend_class}`,
        button_class_sel = `.${button_class}`,
        rect_class_sel   = `.${rect_class}`,

        suffix     = config.suffix == null ? '' : config.suffix,
        margin     = config.margin,
        w          = $(chart_class_sel).width(),

        showLegend = config.legend,
        spacing =  5,  // space between legend entries
        rect    = 16,  // height of legend entry rectangle
        scaling =  1;  // intitial legend scaling factor

    $(chart_class_sel).html('') // delete all content of container

    // set current level to 0 on first load
    if (!config.currentLevel) config.currentLevel = 0

    // declare empty arrays to store breadcrumbs
    if (!config.history) config.history = []
    if (!config.headings) config.headings = []

    // set heading of current level
    if (config.headings.length > 0)
        config.heading = config.headings[config.currentLevel - 1]

    // save first level data as new attribute
    if (config.currentLevel === 0 && !config.og) config.og = config.data

    // set initial direction
    if (config.goingUp === undefined) config.goingUp = false

    let colorrange = d3.range(50)
        .map(d3.scale.category20());

    let color = d3.scale.ordinal()
        .range(colorrange);


// --------------------------------------------------------- //
//  PIE CHART
// --------------------------------------------------------- //

    if (showLegend) margin.right = 250

    let outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius   = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    let pie = d3.layout.pie()
        .sort(null)
        .value(d => d.value);

    let pieData = pie(config.data);

    let arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // bigger outerRadius for mouseover transition
    let arcOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.05);

    // create svg area
    let svg = d3.selectAll(chart_class_sel)
        .append('svg')
        .attr({id : `${containerId}_svg` , width : w, height : h})
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    let heading = svg.append('text')
        .text(config.heading)
        .attr('x', outerRadius)
        .attr('y', - margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold');

    // append group for each datum in config.data
    let arcs = svg.selectAll(layer_class_sel)
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', layer_class)
        .attr('transform', `translate(${outerRadius}, ${outerRadius})`);

    // generate pie slices
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .style('stroke', 'white')
        // grow on mouseover
        .on('mouseover', function(d){
            key = d.data.label
            d3.select(this)
                .transition()
                    .duration(125)
                    .ease('in')
                    .attr('d', arcOver)

            // make the legend rectangle transition depending on textwidth
            d3.selectAll(rect_class_sel)
                .transition()
                    .attr('width', function(d) {
                        if (d.data.label == key) {
                            // nextsibling of rectangle is always its label
                            let w = d3.select(this.nextSibling).node().getBBox().width
                            return 2 * rect + w
                        } else {
                            return rect
                        }
                    })
        })
        // back to normal on mouseout
        .on('mouseout', function(d) {
            key = d.data.label
            d3.select(this)
                .transition()
                    .ease('out')
                    .delay(100)
                    .duration(150)
                    .attr('d', arc)

            d3.selectAll(rect_class_sel)
                .transition()
                    .attr('width', rect)
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
                        .attr('d', arcOver)
            }
        })
        // drill down one level on click
        .on('click', function() {
            // check for child nodes and set them as config.data
            let children = this.__data__.data[config.inner];
            if (children !== undefined) {
                config.headings.push(this.__data__.data.label)
                config.data = children;
                config.currentLevel++
                config.history.push(children)
                config.goingUp = false
                draw_pie(config)
            }
        });


    if (!showLegend) {
        // create the labels at the center of the pie slices
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .text(d => `${d.data.label}`)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold');
    }

// --------------------------------------------------------- //
//  UP BUTTON
//  to-do: fade/unfade transitions for the arrow polygon
// --------------------------------------------------------- //

    let upBtn = svg.append('g')
        .attr('class', button_class);

    // determine the initial radius based on current level and direction
    let rad   = outerRadius / 7,
        rInit = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

    let btnAttr = {
                r : rInit,
             fill : 'green',
        transform : `translate(${outerRadius * 1.9}, 0)`,
            class : button_class
    }

    let circ = upBtn.append('circle')
        .attr(btnAttr)


    // add up-triangle to the button to make clear what it does
    let arrow = upBtn.append('polygon')
        .attr('class', button_class)
        .attr('transform', `translate(${outerRadius * 1.9}, 0)`)
        .attr('fill', 'white')
        .attr('points', function() {
            if (config.currentLevel > 0)
                // make coords relative to button size
                return `${-rad/3},${rad/3} 0,${-rad/2} ${rad/3},${rad/3} 0,${rad/4}`
        })
        .style('pointer-events', 'none'); // make arrow clickthrough for now


    // disable some transitions on root level because they cause
    // problems with the conditional transitions further down
    if (config.currentLevel > 0) {

        circ.on('mouseover', function() {
                d3.select(this)
                    .transition()
                        .duration(125)
                        .ease('in')
                        .attr('r', rad * 1.05)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                        .ease('out')
                        .delay(100)
                        .duration(150)
                        .attr('r', rad)
            })
            .on('mousedown', function() {
                d3.select(this)
                    .transition()
                        .ease('bounce')
                        .attr('r', rad * 0.95)
            })
    }

    circ.on('click', function() {
        // check if parent layer is root
        if (config.history[config.currentLevel - 2] !== undefined) {
            config.data = config.history[--config.currentLevel - 1]
            config.history.pop()   // delete last history entry
            config.headings.pop()  // delete last heading in heading history
            config.goingUp = true
            draw_pie(config)
        }
        else if (config.currentLevel == 1) {
            config.data = config.og
            config.currentLevel--
            config.history.pop()
            config.headings.pop()
            config.goingUp = true
            config.heading = '' // empty heading on root level
            draw_pie(config)
        }
    });

    // conditional transitions on up-button
    if (config.currentLevel == 1) {
        // make button appear on level 1
        circ.transition()
            .ease('bounce')
            .duration(500)
            .attr('r', rad)
    }
    else if (config.currentLevel == 0){
        // make button dissappear on root level
        circ.transition()
            .delay(150)
            .ease('out')
            .attr('r', 0)

        // setting goingUp to false will set the initial radius to 0 for the
        // next redraw so the transition will not trigger again on page zoom
        config.goingUp = false
    }

// --------------------------------------------------------- //
//  LEGEND
//  todo: multiple columns instead of scaling down to unreadable sizes
// --------------------------------------------------------- //

    if (showLegend) {

        // feed legend current pie data
        let legend = svg.selectAll(legend_class_sel)
            .data(pieData)
            .enter()
            .append('g')
            .attr('class', legend_class)
            .attr('transform', function(d, i) {

                // is the legend bigger than the svg, scale its content
                if ((rect + spacing) * pieData.length > h) {

                    // determine scaling
                    scaling = (h - 2 * spacing) / ((rect + spacing) * pieData.length)
                    rect    = rect * scaling
                    spacing = spacing  * scaling

                }

                let height = rect + spacing,  // height of legend entry rectangle
                    offset = height * pieData.length,  // height of the legend
                    dx = w - margin.right,
                    dy = (outerRadius - offset / 2) + i * height + spacing;

                return `translate(${dx}, ${dy})`

            });

        // legend rectangle attributes
        let legendAttrs = {
            width : rect,
           height : rect,
            class : rect_class,
             fill : (d, i) => color(i),
           stroke : (d, i) => color(i)
        };

        legend.append('rect')
            .attr(legendAttrs)

        // add legend entry labels
        legendText = legend.append('text')
            .style('font-size', function() {
                let fontSize = Math.round(10 * scaling)
                return `${fontSize}px`
            })
            .style('font-weight', 'bold')
            .attr('x', legendAttrs.width + spacing)
            .attr('y', (legendAttrs.height + 1.5 * spacing) / 2)
            .text(d => text_truncate(d.data.label, 13)) // truncate long strings
            // .text(d => d.data.label)

        // show full label on hover
        legendText.on('mouseover', function() {
            d3.select(this)
                .transition()
                    .text(this.__data__.data.label)
        })
        // truncate long strings again on mouseout
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                    .text(d => text_truncate(d.data.label, 13))
        })

        // let legend entries behave like arcs when hovering and clicking
        legend.selectAll('rect')
            .on('mouseover', function(d) {
                key = d.data.label
                arcs.selectAll('path')
                    .each(function() {
                        arcLabel = this.__data__.data.label
                        d3.select(this)
                            .transition()
                            .duration(250)
                            .attr('d', function(d) {
                                let newArc = key == arcLabel ? arcOver : arc;
                                return newArc(d)
                            })
                    })
            })
            .on('mouseout', function() {
                arcs.selectAll('path')
                    .transition()
                        .ease('out')
                        .attr('d', arc)
            })
            // back to normal when left button is pressed
            .on('mousedown', function() {
                arcs.selectAll('path')
                    .each(function() {
                        d3.select(this)
                            .transition()
                                .ease('bounce')
                                .attr('d', arc)
                    })
            })
            // grow back to mouseover size on mouseup when on deepest level
            .on('mouseup', function(d) {
                key = d.data.label
                arcs.selectAll('path')
                    .each(function() {
                        let children = this.__data__.data[config.inner],
                            arcLabel = this.__data__.data.label;

                        if (children === undefined) {
                            d3.select(this)
                                .transition()
                                    .ease('out')
                                    .duration(150)
                                    .attr('d', function(d) {
                                        let newArc = key == arcLabel ? arcOver : arc;
                                        return newArc(d)
                                    })
                        }
                    })
            })
            // drill down one level on click
            .on('click', function() {
                // check for child nodes and set them as config.data
                let children = this.__data__.data[config.inner];
                if (children !== undefined) {
                    config.headings.push(this.__data__.data.label)
                    config.data = children;
                    config.currentLevel++
                    config.history.push(children)
                    config.goingUp = false
                    draw_pie(config)
                }
            });
    }


// --------------------------------------------------------- //
//  TOOLTIP
// --------------------------------------------------------- //

} // eof


text_truncate = function(str, length) {
    if (length === null) length = 15;
    if (str.length > length) return `${str.substring(0, length - 3)}...`
    else return str;
}