function draw_pie(config) {

  const maxRadius  = config.max_radius,  // max outerRadius
    minRadius      = config.min_radius,  // min outerRadius

    divClass    = config.div_class,      // class name of div container
    arcClass    = `arc_${divClass}`,     // class name for arc path elements
    arcGrpClass = `g_${arcClass}`,       // class name for arc group elements
    buttonClass = `up_btn_${divClass}`,  // class name for up-button circle
    labelClass  = `label_${divClass}`,   // class name for label group element
    legendClass = `legend_${divClass}`,  // class name for legend entry group
    rectClass   = `rect_${divClass}`,    // class name for legend rectangles
    ttipClass   = `tooltip_${divClass}`, // class name for tooltip div element

    arcClassSel    = `.${arcClass}`,     // selector for arc path elements
    arcGrpClassSel = `.${arcGrpClass}`,  // selector for arc group elements
    buttonClassSel = `.${buttonClass}`,  // selector for up-button circle
    chartClassSel  = `.${divClass}`,     // selector for div container
    labelClassSel  = `.${labelClass}`,   // selector for label group element
    legendClassSel = `.${legendClass}`,  // selector for legend entry group
    rectClassSel   = `.${rectClass}`,    // selector for legend rectangles
    ttipClassSel   = `.${ttipClass}`,    // selector for tooltip div element

    margin        = config.margin,       // margin object
    showHeading   = config.headline,     // toggles headline
    showLabels    = config.labels,       // toggles labels
    showLegend    = config.legend,       // toggles legend
    fancyLegend   = config.fancy_legend, // toggles legend rectangle transition

    maxTxtLen     = config.max_txt_len || null,  // max allowed length of legend text
    labelFontSize = config.label_size  || 12,

    w = $(chartClassSel).width(), // width of div container
    duration = 600;  // duration for main transitions (tweenIn/tweenOut/labels...)

  // initial declaration of legend params
  let initialLegendScaling =  1,  // intitial legend scaling factor
    initialLegendSpacing   =  5,  // space between legend entries
    initialLegendFontSize  = 10,  // legend text font size
    initialLegendRectSize  = 15;  // height of legend rectangle

  $(chartClassSel).html('') // delete all content of container
  $(ttipClassSel).remove()  // remove all leftover tooltips on redraw

  // store initial legend params inside config
  config.scaling  = initialLegendScaling
  config.rectSize = initialLegendRectSize
  config.spacing  = initialLegendSpacing
  config.fontSize = initialLegendFontSize

  // apply scaling in case it was set manually to anything else than 1
  config.rectSize = config.rectSize * config.scaling
  config.spacing  = config.spacing  * config.scaling
  config.fontSize = config.fontSize * config.scaling

  const colorrange = {
      blue : ['#045A8D', '#2B8CBE', '#74A9CF', '#A6BDDB', '#D0D1E6', '#F1EEF6'],
    orange : ['#B30000', '#E34A33', '#FC8D59', '#FDBB84', '#FDD49E', '#FEF0D9'],
      pink : ['#980043', '#DD1C77', '#DF65B0', '#C994C7', '#D4B9DA', '#F1EEF6'],
     green : ['#10562d', '#188144', '#1fa055', '#21ab5a', '#25c166', '#29d671',
              '#3eda7f', '#69e29c', '#94ebb8'],
    nature : ['#77729b', '#ca6764', '#b3a75c', '#659faf', '#988261', '#fa9c4b',
              '#fcc862'],
     cat10 : d3.range(10).map(d3.scale.category10()),
     cat20 : d3.range(20).map(d3.scale.category20()),
    cat20b : d3.range(20).map(d3.scale.category20b()),
    cat20c : d3.range(20).map(d3.scale.category20c())
  };

  const color = d3.scale.ordinal()
    .range(colorrange[config.color]);

  // set current level to 0 on first load
  if (!config.currentLevel) config.currentLevel = 0

  // create empty array to store breadcrumbs
  if (config.currentLevel === 0 && !config.history) {
    config.history = []
    config.history.push(config.data)
  }

  // increase right margin if legend is shown
  if (showLegend) margin.right = w * 0.45

  // increase left and right margins if outside labels are shown
  if (showLabels) {
    margin.left  = Math.max(0.2 * w, margin.left)
    margin.right = Math.max(0.15 * w, margin.right)
  }

  // pie chart params
  const innerRadius = 0;
  let outerRadius   = (w - margin.left - margin.right) / 2;

  outerRadius = Math.max(outerRadius, minRadius)
  outerRadius = Math.min(outerRadius, maxRadius)

  const h = 2 * outerRadius + margin.top + margin.bottom;  // height of svg container

  // calculate amount of empty horizontal space, half it to center the pie chart
  const hDiff = (w - (outerRadius * 2) - margin.left - margin.right) / 2;

  // define tooltip (coords are declared later on mouse events)
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', ttipClass)
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
      .style('opacity', 0.8);

  // set initial direction
  if (config.goingUp === undefined) config.goingUp = false
  // config.goingUp is used to decide for a radius for the layer-up button.
  // without it, the "pop up" transition of the circle would play every drill down


// --------------------------------------------------------- //
//  PIE CHART
// --------------------------------------------------------- //

  // declare some variables that we dont want to execute every update

  // pie chart constructor function
  const pie = d3.layout.pie()
    .sort(null)  // do not sort the slices
    .value(d => d.value);

  let pieData = pie(config.data);

  // standard arc generator
  const arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  // bigger outerRadius for mouseover transition
  const arcOver = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius * 1.05);

  // create svg area
  const svg = d3.selectAll(chartClassSel)
    .append('svg')
      .attr({id : `${divClass}_svg` , width : w, height : h})
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // create circle as backdrop for the chart
  const background = svg.append('circle')
    .attr('transform', `translate(${outerRadius + hDiff}, ${outerRadius})`)
    .attr('r', outerRadius)
    .attr('fill', (d, i) => color(i))
    .attr('opacity', 0.2)

  // group for labels
  const labels = svg.append('g')
    .attr('class', labelClass)

  // group for pie slices
  let arcs = svg.append('g')
    .attr('class', arcGrpClass)

  function update(config) {
    // update the chart with the current data (sub)set
    // legend and up button constructor functions are called at the bottom

    // redeclare starting values for legend parameters
    config.rectSize = initialLegendRectSize
    config.spacing  = initialLegendSpacing
    config.fontSize = initialLegendFontSize
    config.scaling  = initialLegendScaling

    pieData = pie(config.data)
    let paths = arcs.selectAll(arcClassSel)
      .data(pieData, d => d.data.label)

    paths.enter()
      .append('path')
      .attr('d', arc)
      .attr('class', arcClass)
      .attr('transform', `translate(${outerRadius + hDiff}, ${outerRadius})`)
      .attr('fill', (d, i) => color(i))
      .style('stroke', 'white')
      .each(function( ) { this._pointerEvents = false })
      .each(function(d) { this._current = d });

    paths.transition()
      .duration(duration)
      .attrTween('d', tweenIn)
      .each('end', function() { this._pointerEvents = true })

    paths.on('mouseover', function(d) {
      if (this._pointerEvents) {
      // grow on mouseover
        d3.select(this)
          .transition()
            .duration(125)
            .ease('in')
            .attr('d', arcOver)

        if (fancyLegend) {
          // make the legend rectangle transition
          // width of transition depends on length of label text next to it
          let key = d.data.label;
          d3.selectAll(rectClassSel)
            .transition()
              .attr('width', function(d) {

                if (d.data.label == key) {
                  // get width of text next to the rectangle
                  // nextSibling of rectangle is always its label
                  const wd = d3.select(this.nextSibling).node().getBBox().width;

                  return config.rectSize + wd + 2 * config.spacing
                } else {

                  return config.rectSize
                }
              })
        }
      }
    })
    .on('mousemove', function(d) {
      if (this._pointerEvents) {
        // grow on mousemove
        d3.select(this)
          .transition()
            .duration(125)
            .ease('in')
            .attr('d', arcOver)
        // show tooltip at cursor position and make it clickthrough
        tooltip.html(d.data.tooltip)
          .style('top',  `${d3.event.pageY + 15}px`)
          .style('left', `${d3.event.pageX + 10}px`)
          .style('pointer-events', 'none')
          .style('visibility', 'visible')
      }
    })
    .on('mouseout', function() {
      if (this._pointerEvents) {
        // transition arc to normal size
        d3.select(this)
          .transition()
            .ease('out')
            .delay(100)
            .duration(150)
            .attr('d', arc)

        // transition legend rectangle back to normal size
        d3.selectAll(rectClassSel)
          .transition()
            .attr('width', config.rectSize)

        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
      }
    })
    .on('mousedown', function() {
      if (this._pointerEvents) {
        // transition arc back to normal size
        d3.select(this)
          .transition()
            .ease('bounce')
            .attr('d', arc)
      }
    })
    .on('mouseup', function() {
      if (this._pointerEvents) {
        // transition back to mouseover size when on deepest level
        const children = this.__data__.data[config.inner];
        if (children === undefined) {
          d3.select(this)
            .transition()
              .ease('out')
              .duration(150)
              .attr('d', arcOver)
        }
      }
    })
    .on('click', function() {
      // drill down one level
      // check for child nodes and set them as config.data
      const children = this.__data__.data[config.inner];
      if (children) {
        if (showHeading) config.headings.push(this.__data__.data.label)

        config.currentLevel++
        config.data    = children
        config.goingUp = false
        config.history.push(children)
        paths.each(function() {this._pointerEvents = false})

        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
        update(config)
      }
    });

    // Collapse sectors for the exit selection
    paths.exit()
      .transition()
        .duration(duration)
        .attrTween('d', tweenOut)
      .remove();

    // display headline with name of current layer
    if (showHeading) {

      if (!config.headings) config.headings = [] // array for heading breadcrumbs
      if (config.currentLevel === 0) config.heading = '' // empty on root level
      if (config.headings.length > 0)
        // set current headline
        config.heading = config.headings[config.currentLevel - 1]

      svg.selectAll('text.heading')
        .remove()

      // create heading that displays the current layer's label
      let heading = svg.append('text')
        .text(config.heading)
        .attr('class', 'heading')
        .attr('x', () => outerRadius + hDiff)
        .attr('y', - margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold');
    }

    updateButton(config, paths)  // update the back-button

    if (showLegend) updateLegend(config, paths)  // update legend
    if (showLabels) updateLabels(config)
  }


// --------------------------------------------------------- //
//  UP BUTTON
// --------------------------------------------------------- //

  function updateButton(config, paths) {

    // remove old button
    svg.selectAll(buttonClassSel)
      .remove()

    const upBtn = svg.append('g')
      .attr('class', buttonClass);

    // determine initial and regular radius of the up-button circle element
    const rad = outerRadius / 7,
      rInit   = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

    const btnAttr = {
              r : rInit,
           fill : 'green',
      transform : `translate(${outerRadius * 1.9 + hDiff}, 0)`,
          class : buttonClass
    };

    const circ = upBtn.append('circle')
      .attr(btnAttr);

    const backTxt = upBtn.append('text')
      .text('BACK')
      .attr('transform', `translate(${outerRadius * 1.9 + hDiff}, ${rad / 8})`)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', `${rInit / 2}px`)
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // disable some transitions on root level because they cause
    // problems with the conditional transitions further down
    if (config.currentLevel > 0) {
      circ.on('mouseover', function() {
        d3.select(this)
          .transition()
            .duration(125)
            .ease('in')
            .attr('r', rad * 1.05)

        backTxt.transition()
          .ease('in')
          .duration(125)
          .style('font-size', `${(rad / 2) * 1.05}px`)
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
            .ease('out')
            .delay(100)
            .duration(150)
            .attr('r', rad)

        backTxt.transition()
          .ease('out')
          .delay(100)
          .duration(150)
          .style('font-size', `${rad / 2}px`)
      })
      .on('mousedown', function() {
        d3.select(this)
          .transition()
            .ease('bounce')
            .attr('r', rad * 0.95)

        backTxt.transition()
          .ease('out')
          .delay(100)
          .duration(150)
          .style('font-size', `${(rad / 2) * 0.95}px`)
      })
    }

    circ.on('click', function() {
      // check if we are on root layer
      if (config.history[config.currentLevel - 1] !== undefined) {
        config.data    = config.history[--config.currentLevel]
        config.goingUp = true
        config.history.pop()  // delete last history breadcrumb

        paths.each(function() { this._pointerEvents = false })

        if (showHeading) config.headings.pop()  // delete last heading breadcrumb

        update(config)
      }
    })

    // conditional transitions on up-button
    if (config.currentLevel == 1) {
      // make button appear on level 1
      circ.transition()
        .ease('bounce')
        .duration(500)
        .attr('r', rad)

      backTxt.transition()
        .ease('bounce')
        .duration(500)
        .style('font-size', `${rad / 2}px`)
    }
    else if (config.currentLevel == 0){
      // make button dissappear on root level
      circ.transition()
        .delay(150)
        .ease('out')
        .attr('r', 0)

      backTxt.transition()
        .ease('out')
        .delay(150)
        .style('font-size', '0px')

      // setting goingUp to false will set the initial radius to 0 for the
      // next redraw so the transition will not trigger again on page zoom
      config.goingUp = false
    }
  }


// --------------------------------------------------------- //
//  LABEL
// --------------------------------------------------------- //


  function updateLabels(config) {

    pieData = pie(config.data)

    // arc generator for better label alignment
    const outerArc = d3.svg.arc()
      .innerRadius(outerRadius)
      .outerRadius(outerRadius);

    // arc generator for better label alignment
    const outermostArc = d3.svg.arc()
      .innerRadius(outerRadius * 1.05)
      .outerRadius(outerRadius * 1.15);

    // move the label group element to the center
    labels.attr('transform', `translate(${outerRadius + hDiff}, ${outerRadius})`)

    // bind data to empty selection
    let text = labels.selectAll('text')
      .data(pieData, d => d.data.label);

    text.enter()
      .append('text')
      .attr('dy', '.35em')
      .style('font-size', `${labelFontSize}px`)
      .style('opacity', 0)
      .text(d => d.data.label)
      .attr('transform', function(d) {
        let xy = outermostArc.centroid(d);

        // change x coordinate to move label further to the left or right
        xy[0] = 1.25 * outerRadius * (midAngle(d) < Math.PI ? 1 : -1);
        return `translate(${xy})`;
      })
      .style('text-anchor', function(d){
        return midAngle(d) < Math.PI ? 'start' : 'end';
      })

    text.transition()
        .delay(duration)
        .duration(duration)
        .style('opacity', 1)

    text.exit()
      .transition()
        .duration(duration)
        .style('opacity', 0)
      .remove();

    polyline = svg.select(labelClassSel)
      .selectAll('polyline')
      .data(pie(config.data), d => d.data.label);

    polyline.enter()
      .append('polyline')
      .style('opacity', 0)
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('stroke-width', '2px')
      .attr('points', function(d) {
        let xy = outermostArc.centroid(d);

        // change x coordinate to move label further to the left or right
        xy[0] = 1.2 * outerRadius * (midAngle(d) < Math.PI ? 1 : -1)
        return [outerArc.centroid(d), outermostArc.centroid(d), xy];
      })

    polyline.transition()
      .delay(duration)
      .duration(duration)
      .style('opacity', 0.6)

    polyline.exit()
      .transition()
        .duration(duration)
        .style('opacity', 0)
      .remove();
  }


// --------------------------------------------------------- //
//  LEGEND
//  todo: better space management
// --------------------------------------------------------- //

  function updateLegend(c, paths) {
    // build legend components for current data set
    // pass config as c to shorten long lines

    // remove old legend
    svg.selectAll(legendClassSel).remove()

    // feed legend current pie data
    const legend = svg.selectAll(legendClassSel)
      .data(pieData)

    legend.enter()
      .append('g')
        .attr('class', legendClass)
        .attr('transform', function(d, i) {
          // n is the max number of legend entries that fit in the svg vertically
          const n = Math.floor( (h - margin.top - margin.bottom) /
                                (c.rectSize + c.spacing) * c.scaling )

          if (pieData.length < n) {
            // if all rectangles fit into one column, use only one column
            const height = c.rectSize + c.spacing,
              offset     = height * pieData.length,
              dx = w - margin.right,
              dy = (outerRadius - offset / 2) + i * height + c.spacing;

            return `translate(${dx}, ${dy})`
          } else {
            // use two columns if there are too many rectangles for one column
            if (((c.rectSize + c.spacing) * pieData.length) > h * 2) {

              // scale down the legend if there are too many rectangles for two cols
              c.scaling = (h * 2 - margin.top - margin.bottom) /
                          ((c.rectSize + c.spacing) * pieData.length)

              c.rectSize = c.rectSize * c.scaling
              c.spacing  = c.spacing  * c.scaling
              c.fontSize = Math.round(c.fontSize * c.scaling)
            }

            // height and position for legend entries in two columns
            const height = c.rectSize + c.spacing,
              offset     = height * pieData.length,
              dx = (w - margin.right) + (i % 2) * (margin.right / 3),
              dy = (outerRadius - offset / 4) + Math.floor(i / 2) * height;

            return `translate(${dx}, ${dy})`
          }
      });

    // legend rectangle attributes
    const legendAttrs = {
       width : c.rectSize,
      height : c.rectSize,
       class : rectClass,
        fill : (d, i) => color(i),
      stroke : (d, i) => color(i)
    };

    legend.append('rect')
      .attr(legendAttrs)

    // add legend entry labels
    legendText = legend.append('text')
      .attr('x', legendAttrs.width + c.spacing)
      .attr('y', `${legendAttrs.height / 2 + c.fontSize / 3}px`)
      .style('font-size', () => `${c.fontSize}px`)
      .style('font-weight', 'bold')
      .text(d => text_truncate(d.data.label, maxTxtLen)) // truncate long strings

    // show full label on hover
    legendText.on('mouseover', function() {
      d3.select(this)
        .text(this.__data__.data.label)
    })
    // truncate long strings again on mouseout
    .on('mouseout', function() {
      d3.select(this)
        .text(d => text_truncate(d.data.label, maxTxtLen))
    })

    // let legend entries behave like arcs when hovering and clicking
    legend.selectAll('rect')
      .on('mouseover', function(d) {
        // show tooltip at cursor position and make it clickthrough
        tooltip.html(d.data.tooltip)
          .style('top',  `${d3.event.pageY + 15}px`)  // slightly down
          .style('left', `${d3.event.pageX - 50}px`)  // slightly to the right
          .style('pointer-events', 'none')            // make clickthrough
          .style('visibility', 'visible')             // show tooltip

        let key = d.data.label;
        paths.each(function() {
          if (this._pointerEvents) {
            arcLabel = this.__data__.data.label
            d3.select(this)
              .transition()
              .duration(250)
              .attr('d', function(d) {
                const newArc = key == arcLabel ? arcOver : arc;
                return newArc(d)
              })
            }
          })
      })
      .on('mousemove', function(d){
        // show tooltip at cursor position and make it clickthrough
        tooltip.html(d.data.tooltip)
          .style('top',  `${d3.event.pageY + 15}px`)  // slightly down
          .style('left', `${d3.event.pageX + 10}px`)  // slightly to the right
          .style('pointer-events', 'none')
          .style('visibility', 'visible')
      })
      .on('mouseout', function() {
        paths.each(function() {
          if (this._pointerEvents) {
            d3.select(this)
              .transition()
              .ease('out')
              .attr('d', arc)
            }
        })
        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
      })
      .on('mousedown', function() {
        // shrink arc back to normal when left button is pressed
        paths.each(function() {
          if (this._pointerEvents) {
            d3.select(this)
              .transition()
                .ease('bounce')
                .attr('d', arc)
          }
        })
      })
      .on('mouseup', function(d) {
        let key = d.data.label;
        // grow arc back to mouseover size on mouseup when on deepest level
        paths.each(function() {
          if (this._pointerEvents) {
            const children = this.__data__.data[config.inner],
              arcLabel     = this.__data__.data.label;

            if (children === undefined) {
              d3.select(this)
                .transition()
                  .ease('out')
                  .duration(150)
                  .attr('d', function(d) {
                    // return invokation of arc constructor function
                    const newArc = key == arcLabel ? arcOver : arc;
                    return newArc(d)
                  })
            }
          }
        })
      })
      .on('click', function() {
        // drill down one level
        // check for child nodes and set them as config.data
        const children = this.__data__.data[config.inner];
        if (children !== undefined) {
          config.currentLevel++
          config.data    = children
          config.goingUp = false
          config.history.push(children)

          if (showHeading) config.headings.push(this.__data__.data.label)
          paths.each(function() {this._pointerEvents = false})

          // hide tooltip and remove its content
          tooltip.html('').style('visibility', 'hidden');
          update(config)
        }
      });

  }

  update(config)

  function tweenIn(d) {
    // interpolate an arc from 0° to it's designated angle
    let i = d3.interpolate({startAngle: 0, endAngle: 0}, d);
    this._current = i(0);
    return function(t) {
        return arc(i(t));
    };
  }

  function tweenOut(d) {
    d.startAngle = d.endAngle = 2 * Math.PI;
    let i = d3.interpolate(this._current, d);
    return function(t) {
        return arc(i(t));
    }
  }

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  function text_truncate(str, length) {
    if (length === null) return str;
    if (str.length >= length) return `${str.substring(0, length - 3)}...`;
    else return str;
  }
}
