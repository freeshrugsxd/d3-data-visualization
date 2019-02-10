function draw_pie(config) {

    const divId = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        w       = $(divId).width();

    // save first level data as new attribute
    if (config.currentLevel === 0 && config.og === undefined) {
        config.og = config.data
    }

    $(divId).html('') // delete all content of div container

    const color = d3.scale.linear()
        .domain([0, config.data.length])
        .range(['#FF3112', '#1231FF']);

    const outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius   = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    const pie = d3.layout.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // bigger outerRadius for mouseover transition
    const arcMouseOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.02);

    // x and y coords of the pie chart centre
    const cx = outerRadius + margin.left,
          cy = outerRadius + margin.top;

    // create svg area
    const svg = d3.selectAll(divId)
        .append('svg')
        .attr({id : chartId, width : w, height : h})
        .append('g')
        .attr('transform', `translate(${cx}, ${cy})`);

    // append group for each datum in config.data
    const arcs = svg.selectAll('.arc')
        .data(pie(config.data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    // generate the pie slices
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .style('stroke', 'white')
        .style('stroke-width', '2px')
        .on('mouseover', function(){
            d3.select(this)
                .transition()
                    .duration(125)
                    .ease('in')
                    .attr('d', arcMouseOver);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                    .ease('out')
                    .delay(100)
                    .duration(150)
                    .attr('d', arc);
        })
        .on('click', function() {
            // check if current node has child nodes. If it does, assign
            // children as new data. If not, signal dead end and do not redraw.
            const children = this.__data__.data[config.inner];
            if (children !== undefined) {
                config.data = children;
                config.currentLevel++
                config.history.push(children)
                config.goingUp = false
                draw_pie(config)
            } else {
                // transition to signal a dead end
                d3.select(this)
                    .transition()
                        .ease('bounce')
                        .attr('d', arc)
                    .transition()
                        .ease('out')
                        .duration(150)
                        .attr('d', arcMouseOver)
            }
        });

    // create the labels at the center of the pie slices
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .text(d => `${d.data.label} (${d.value})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px');

    // create circle to be used as a button to go one level up
    const upBtn = svg.append('g')
        .attr('class', 'upButton');

    // depending on two control variables, we determine the initial radius
    const rad = 25,
        rInit = config.currentLevel <= 1 && config.goingUp == false ? 0 : rad;

    const circ = upBtn.append('circle')
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
                        .attr('r', rad * 1.1)
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
        .on('click', function() {
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

        if (config.currentLevel == 1) {
            circ.transition()
                .ease('bounce')
                .duration(500)
                .attr('r', rad)

        } else if (config.currentLevel == 0){
            circ.transition()
                .ease('in')
                .attr('r', 0)
        }
}
