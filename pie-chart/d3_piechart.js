function draw_pie(config) {

  let maxRadius    = config.max_radius,        // max outerRadius
    minRadius      = config.min_radius,        // min outerRadius
    divClass       = config.div_class,         // class name of div container
    layerClass     = `arc_${divClass}`,        // class name for arc svg elements
    legendClass    = `legend_${divClass}`,     // class name for legend entry group
    buttonClass    = `up_btn_${divClass}`,     // class name for up-button circle
    rectClass      = `rect_${divClass}`,       // class name for legend rectangles
    ttipClass      = `tooltip_${divClass}`,    // class name for tooltip div element
    chartClassSel  = `.${divClass}`,           // selector for div container
    layerClassSel  = `.${layerClass}`,         // selector for arc svg elements
    legendClassSel = `.${legendClass}`,        // selector for legend entry group
    buttonClassSel = `.${buttonClass}`,        // selector for up-button circle
    rectClassSel   = `.${rectClass}`,          // selector for legend rectangles
    ttipClassSel   = `.${ttipClass}`,          // selector for tooltip div element
    margin         = config.margin,            // margin object
    w              = $(chartClassSel).width(), // width of div container
    showHeading    = config.headline,          // toggles headline
    showLabels     = config.labels,            // toggles labels
    showLegend     = config.legend,            // toggles legend
    fancyLegend    = config.fancy_legend,      // toggles legend rectangle transition
    maxTxtLen      = config.max_txt_len,       // max allowed length of legend text
    legendFontSize = 12,                       // legend text font size
    labelFontSize  = 14,                       // label text font size
    scaling        =  1,                       // intitial legend scaling factor
    rect           = 16,                       // height of legend rectangle
    spacing        =  5,                       // space between legend entries
    hDiff          =  0;                       // empty space when max radius is used

  $(chartClassSel).html('') // delete all content of container
  $(ttipClassSel).remove()    // remove all leftover tooltips on redraw

  // set current level to 0 on first load
  if (!config.currentLevel) config.currentLevel = 0

  // create empty array to store breadcrumbs
  if (config.currentLevel === 0 && !config.history) {
    config.history = []
    config.history.push(config.data)
  }

  // increase right margin if legend is shown
  if (showLegend) margin.right = w * 0.4

  // pie chart params
  let outerRadius = (w - margin.left - margin.right) / 2, // pie chart's outer radius
    innerRadius = 0                                       // pie chart's inner radius

  // when the dimensions of the div container would support a larger pie chart,
  // but we hit the maximum radius, there will be empty space right next to the chart
  if (outerRadius > maxRadius)
    // calculate the width of the empty space and use it later to center the chart
    hDiff = (w - (maxRadius * 2) - margin.left - margin.right) / 2

  outerRadius = Math.max(outerRadius, minRadius)
  outerRadius = Math.min(outerRadius, maxRadius)

  let h = 2 * outerRadius + margin.top + margin.bottom;   // height of svg container

  // apply scaling in case it was set manually to anything else than 1
  rect    = rect * scaling
  spacing = spacing * scaling
  legendFontSize = legendFontSize * scaling

  let colorrange = {
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

  let color = d3.scale.ordinal()
    .range(colorrange[config.color]);

  // define tooltip (coords are declared later on mouse events)
  let tooltip = d3.select('body')
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
  let svg = d3.selectAll(chartClassSel)
    .append('svg')
    .attr({id : `${divClass}_svg` , width : w, height : h})
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // display headline with name of current layer
  if (showHeading) {

    if (!config.headings) config.headings = [] // empty array for heading breadcrumbs
    if (config.currentLevel === 0) config.heading = '' // empty heading on root level
    if (config.headings.length > 0)
      // set current headline
      config.heading = config.headings[config.currentLevel - 1]

    // create heading that displays the current layer's label
    let heading = svg.append('text')
      .text(config.heading)
      .attr('x', () => outerRadius + hDiff)
      .attr('y', - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold');
  }

  // append a group to svg for every datum in pie(config.data)
  let arcs = svg.selectAll(layerClassSel)
    .data(pieData)
    .enter()
    .append('g')
    .attr('class', layerClass)
    .attr('transform', `translate(${outerRadius + hDiff}, ${outerRadius})`);

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

      if (fancyLegend) {
        // make the legend rectangle transition
        // width of transition depends on length of label text next to it
        key = d.data.label
        d3.selectAll(rectClassSel)
          .transition()
            .attr('width', function(d) {

              if (d.data.label == key) {

                // get width of text next to the rectangle
                // nextSibling of rectangle is always its label
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
      tooltip.html(d.data.tooltip)
        .style('top',  `${d3.event.pageY + 15}px`)
        .style('left', `${d3.event.pageX + 10}px`)
        .style('pointer-events', 'none')
        .style('visibility', 'visible')
    })
    .on('mouseout', function() {
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
          .attr('width', rect)

      // hide tooltip and remove its content
      tooltip.html('').style('visibility', 'hidden');
    })
    .on('mousedown', function() {
      // transition arc back to normal size
      d3.select(this)
        .transition()
          .ease('bounce')
          .attr('d', arc)
    })
    .on('mouseup', function() {
      // transition back to mouseover size when on deepest level
      let children = this.__data__.data[config.inner];
      if (children === undefined) {
        d3.select(this)
          .transition()
            .ease('out')
            .duration(150)
            .attr('d', arcOver)
      }
    })
    .on('click', function() {
      // drill down one level
      // check for child nodes and set them as config.data
      let children = this.__data__.data[config.inner];
      if (children !== undefined) {
        if (showHeading) config.headings.push(this.__data__.data.label)

        config.currentLevel++
        config.data    = children
        config.goingUp = false
        config.history.push(children)

        draw_pie(config)
      }
    });

  if (showLabels)
      // create the labels at the centroids of arcs
      arcs.append('text')
          .attr('transform', d => `translate(${arc.centroid(d)})`)
          .text(d => `${d.data.label}`)
          .attr('text-anchor', 'middle')
          .style('font-size', `${labelFontSize}px`)
          .style('font-weight', 'bold')
          .style('pointer-events', 'none');


// --------------------------------------------------------- //
//  UP BUTTON
// --------------------------------------------------------- //

  let upBtn = svg.append('g')
    .attr('class', buttonClass);

  // determine the initial radius based on current level and direction
  let rad = outerRadius / 7,
    // set initial radius based on direction and current level
    // a radius of 0 is needed for the "pop up" transition on level 1
    // and for the circle to stay hidden when chart is initialized
    rInit = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

  let btnAttr = {
            r : rInit,
         fill : 'green',
    transform : `translate(${outerRadius * 1.9 + hDiff}, 0)`,
        class : buttonClass
  }

  let circ = upBtn.append('circle')
    .attr(btnAttr)

  let backTxt = upBtn.append('text')
    .text('BACK')
    .attr('transform', `translate(${outerRadius * 1.9 + hDiff}, ${rad/8})`)
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

// --------------------------------------------------------- //
//  LEGEND
//  todo: multiple columns instead of scaling down to unreadable sizes
// --------------------------------------------------------- //

  if (showLegend) {

    // feed legend current pie data
    let legend = svg.selectAll(legendClassSel)
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', legendClass)
      .attr('transform', function(d, i) {
        // n is the max number of legend entries that fit in the svg vertically
        let n = Math.floor((h - margin.top - margin.bottom) /
                           (rect + spacing) * scaling)

        if (pieData.length < n) {

          // if all rectangles fit into one column, use only one column
          let height = rect + spacing,
            offset   = height * pieData.length,
            dx = w - margin.right,
            dy = (outerRadius - offset / 2) + i * height + spacing;

          return `translate(${dx}, ${dy})`
        } else {

          // use two columns if there are too many rectangles for one column
          if (((rect + spacing) * pieData.length) > h * 2) {

            // scale down the legend if there are too many rectangles for two cols
            scaling = (h * 2 - margin.top - margin.bottom) /
                      ((rect + spacing) * pieData.length)

            rect     = rect * scaling
            spacing  = spacing * scaling
            legendFontSize = Math.round(legendFontSize * scaling)
          }

          // height and position for legend entries in two columns
          let height = rect + spacing,
            offset   = height * pieData.length,
            dx = (w - margin.right) + (i % 2) * (margin.right / 3),
            dy = (outerRadius - offset / 4) + Math.floor(i / 2) * height + spacing;

          return `translate(${dx}, ${dy})`
        }
    });

    // legend rectangle attributes
    let legendAttrs = {
       width : rect,
      height : rect,
       class : rectClass,
        fill : (d, i) => color(i),
      stroke : (d, i) => color(i)
    };

    legend.append('rect')
      .attr(legendAttrs)

    // add legend entry labels
    legendText = legend.append('text')
      .attr('x', legendAttrs.width + spacing)
      .attr('y', `${0.5 * legendAttrs.height + legendFontSize/3}px`)
      .style('font-size', () => `${legendFontSize}px`)
      .style('font-weight', 'bold')
      // .style('text-align', 'center')
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
      .on('mousemove', function(d){
        // show tooltip at cursor position and make it clickthrough
        tooltip.html(d.data.tooltip)
          .style('top',  `${d3.event.pageY + 15}px`)  // slightly down
          .style('left', `${d3.event.pageX + 10}px`)  // slightly to the right
          .style('pointer-events', 'none')
          .style('visibility', 'visible')
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
              arcLabel   = this.__data__.data.label;

            if (children === undefined) {
              d3.select(this)
                .transition()
                  .ease('out')
                  .duration(150)
                  .attr('d', function(d) {
                    // return invokation of arc constructor function
                    let newArc = key == arcLabel ? arcOver : arc;
                    return newArc(d)
                  })
            }
          })
      })
      .on('click', function() {
        // drill down one level on click
        // check for child nodes and set them as config.data
        let children = this.__data__.data[config.inner];
        if (children !== undefined) {
          config.currentLevel++
          config.data    = children
          config.goingUp = false
          config.history.push(children)

          if (showHeading) config.headings.push(this.__data__.data.label)

          draw_pie(config)
        }
      });
  }

}

text_truncate = function(str, length) {
  if (length === null) length = 15;
  if (str.length >= length) return `${str.substring(0, length - 3)}...`
  else return str;
}
