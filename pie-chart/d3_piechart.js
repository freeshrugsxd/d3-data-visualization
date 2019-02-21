function draw_pie(config) {

  let ref_width = config.ref_width,
    ref_height  = config.ref_height,
    min_width   = config.min_width,
    min_height  = config.min_height,
    containerId = config.containerId,

    layer_class  = `arc_${containerId}`,
    legend_class = `legend_${containerId}`,
    button_class = `up_btn_${containerId}`,
    rect_class   = `rect_${containerId}`,
    ttip_class   = `tooltip_${containerId}`,

    chart_class_sel  = `.${containerId}`,
    layer_class_sel  = `.${layer_class}`,
    legend_class_sel = `.${legend_class}`,
    button_class_sel = `.${button_class}`,
    rect_class_sel   = `.${rect_class}`,
    ttip_class_sel   = `.${ttip_class}`,

    suffix = config.suffix == null ? '' : config.suffix,
    margin = config.margin,
    w      = $(chart_class_sel).width(),

    showHeading = config.headline,
    showLabels  = config.labels,
    showLegend  = config.legend,
    animLegend  = config.animated_legend,
    rect        = 16,  // height of legend entry rectangle
    spacing     =  5,  // space between legend entries
    scaling     =  1;  // intitial legend scaling factor

  $(chart_class_sel).html('') // delete all content of container
  $(ttip_class_sel).remove()    // remove all leftover tooltips on redraw

  // set current level to 0 on first load
  if (!config.currentLevel) config.currentLevel = 0

  // save first level data as new attribute
  if (config.currentLevel === 0 && !config.og) config.og = config.data

  if (config.goingUp === undefined) config.goingUp = false // set initial direction

  // create empty array to store breadcrumbs
  if (!config.history) config.history = []

  // increase right margin if legend is shown
  if (showLegend) margin.right = 250

  // pie chart params
  let outerRadius = (w - margin.left - margin.right) / 2, // pie chart's outer radius
    innerRadius = 0,                                      // pie chart's inner radius
    h = 2 * outerRadius + margin.top + margin.bottom;     // height of svg container

  let colorrange = d3.range(50)
    .map(d3.scale.category20());

  let color = d3.scale.ordinal()
    .range(colorrange);

  // define tooltip
  // coords are declared later on mouse events
  let tooltip = d3.select('body')
    .append('div')
    .attr('class', ttip_class)
    .style('position', 'absolute')
    .style('z-index', '20')
    .style('visibility', 'hidden')
    .style('font-weight', 'bold')
    .style('font-size', '10px')
    .style('color', '#000')
    .style('line-height', 1)
    .style('padding', '5px')
    .style('background', '#fff')
    .style('border-radius', '2px')
    .style('opacity', 0.7);

// --------------------------------------------------------- //
//  PIE CHART
// --------------------------------------------------------- //

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


  // display headline with name of current layer
  if (showHeading) {
    // create empty array for heading breadcrumbs
    if (!config.headings) config.headings = []
    if (config.currentLevel === 0) config.heading = ''
    // set heading of current level
    if (config.headings.length > 0)
      config.heading = config.headings[config.currentLevel - 1]

    // show the current level's label
    let heading = svg.append('text')
      .text(config.heading)
      .attr('x', outerRadius)
      .attr('y', - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold');
  }

  // append a group to svg for every datum in pie(config.data)
  let arcs = svg.selectAll(layer_class_sel)
    .data(pieData)
    .enter()
    .append('g')
    .attr('class', layer_class)
    .attr('transform', `translate(${outerRadius}, ${outerRadius})`);

  // generate arcs with mouse events
  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i))
    .style('stroke', 'white')
    .on('mouseover', function(d){
      // grow on mouseover
      d3.select(this)
        .transition()
          .duration(125)
          .ease('in')
          .attr('d', arcOver)

      if (animLegend) {
        // make the legend rectangle transition depending width of it's label
        key = d.data.label
        d3.selectAll(rect_class_sel)
          .transition()
            .attr('width', function(d) {
              if (d.data.label == key) {
                // nextsibling of rectangle is always its label
                let w = d3.select(this.nextSibling).node().getBBox().width;
                return rect + w + 2 * spacing
              } else {
                return rect
              }
            })
      }
    })
    .on('mousemove', function(d) {
      // show tooltip at cursor position and make it clickthrough
      tooltip.style('top', `${d3.event.pageY + 15}px`)
        .style('left', `${d3.event.pageX + 10}px`)
        .style('pointer-events', 'none')
        .style('visibility', 'visible')
        .html(d.data.tooltip)
    })
    .on('mouseout', function() {
      // shrink to normal size
      d3.select(this)
        .transition()
          .ease('out')
          .delay(100)
          .duration(150)
          .attr('d', arc)

      // shrink legend rectangle back to normal size
      d3.selectAll(rect_class_sel)
        .transition()
          .attr('width', rect)

      // hide tooltip and remove its content
      tooltip.html('').style('visibility', 'hidden');
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
        if (showHeading) config.headings.push(this.__data__.data.label)

        config.data = children
        config.currentLevel++
        config.history.push(children)
        config.goingUp = false
        draw_pie(config)
      }
    });


  if (showLabels)
      // create the labels at the center of the pie slices
      arcs.append('text')
          .attr('transform', d => `translate(${arc.centroid(d)})`)
          .text(d => `${d.data.label}`)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none');


// --------------------------------------------------------- //
//  UP BUTTON
//  to-do: fade/unfade transitions for the arrow polygon
// --------------------------------------------------------- //

  let upBtn = svg.append('g')
    .attr('class', button_class);

  // determine the initial radius based on current level and direction
  let rad = outerRadius / 7,
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
      config.history.pop()  // delete last history breadcrumb
      config.goingUp = true

      if (showHeading) config.headings.pop()  // delete last heading breadcrumb

      draw_pie(config)
    }
    else if (config.currentLevel == 1) {
      config.data = config.og
      config.currentLevel--
      config.history.pop()  // delete last history breadcrumb
      config.goingUp = true

      if (showHeading) config.headings.pop()  // delete last heading breadcrumb

      draw_pie(config)
    }
  })

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
      .style('font-size', () => `${Math.round(10 * scaling)}px`)
      .style('font-weight', 'bold')
      .attr('x', legendAttrs.width + spacing)
      .attr('y', (legendAttrs.height + 1.5 * spacing) / 2)
      .text(d => text_truncate(d.data.label, 13)) // truncate long strings
      // .text(d => d.data.label)

    // show full label on hover
    legendText.on('mouseover', function() {
      d3.select(this)
        .text(this.__data__.data.label)
    })
    // truncate long strings again on mouseout
    .on('mouseout', function() {
      d3.select(this)
        .text(d => text_truncate(d.data.label, 13))
    })

    // let legend entries behave like arcs when hovering and clicking
    legend.selectAll('rect')
      .on('mouseover', function(d) {

        // show tooltip at cursor position and make it clickthrough
        tooltip.style('top', `${d3.event.pageY + 15}px`)
          .style('left', `${d3.event.pageX - 50}px`)
          .style('pointer-events', 'none')
          .style('visibility', 'visible')
          .html(d.data.tooltip)

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
      .on('mousemove', function(){
        // show tooltip at cursor position and make it clickthrough
        tooltip.style('top', `${d3.event.pageY + 15}px`)
          .style('left', `${d3.event.pageX + 10}px`)
          .style('pointer-events', 'none')
          .style('visibility', 'visible')
          .html(d.data.tooltip)
      })
      .on('mouseout', function() {
        arcs.selectAll('path')
          .transition()
            .ease('out')
            .attr('d', arc)

        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
      })
      .on('mousedown', function() {
        // shrink arc back to normal when left button is pressed
        arcs.selectAll('path')
          .each(function() {
            d3.select(this)
              .transition()
                .ease('bounce')
                .attr('d', arc)
          })
      })
      .on('mouseup', function(d) {
        key = d.data.label
        // grow arc back to mouseover size on mouseup when on deepest level
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
          if (showHeading) config.headings.push(this.__data__.data.label)

          config.data = children
          config.currentLevel++
          config.history.push(children)
          config.goingUp = false
          draw_pie(config)
        }
      });
  }

}

text_truncate = function(str, length) {
  if (length === null) length = 15;
  if (str.length > length) return `${str.substring(0, length - 3)}...`
  else return str;
}
