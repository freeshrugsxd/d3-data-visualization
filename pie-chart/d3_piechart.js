function draw_pie(config) {

    let divId   = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        objArr  = [],
        w       = $(divId).width()

    console.log('data', config.data)

    // figure out what chart needs to be removed
    d3.selectAll('svg').remove()
    // write json objects into array
    Object.keys(config.data).forEach(function(key) {
        objArr.push(config.data[key])
    })

    let color = d3.scale.linear()
        .domain([0, objArr.length])
        .range(['#FF3112', '#1231FF']);

    let innerRadius = 0,
        outerRadius = (w - margin.left - margin.right) / 2

    let arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // create svg area
    let h = 2 * outerRadius + margin.top + margin.bottom
    let svg = d3.selectAll(divId)
        .append('svg')
        .attr({
                id : chartId,
             width : w,
            height : h
        })

    // x and y coords of the pie chart centre
    let cx = outerRadius + margin.left,
        cy = outerRadius + margin.top

    let group = svg.append('g')
        .attr('transform', 'translate(' + cx + ',' + cy + ')')
        .attr('class', 'pieChart')

    let pie = d3.layout.pie()
        .value(function(d) {
            // console.log('pie().value() d =', d);
            return d3.sum(d3.values(d))
        });

    let arcs = group.selectAll('path')
        .data(pie(objArr))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) { return color(i) })

        .on('mouseover', function() {
            d3.select(this).attr('fill-opacity', .9)
        })

        .on('mouseout', function() {
            d3.select(this).attr('fill-opacity', 1)
        })
        /*
        on click: draw chart on the right, but keep chart on
        the left.  */
        .on('click', function() {
            draw_pie(config)
            console.log('onclick this.__data__.data', this.__data__.data)
            let tmp = this.__data__.data
            // config.div_id = '#rightDiv'
            // config.chart_id = '#rightChart'
            config.data = []
            // create array of objects
            Object.keys(tmp).forEach( function(key) {
                config.data.push({key : tmp[key]})
            })

            draw_pie(config)
        })

    let text = group.selectAll('text')
        .data(pie(objArr))
        .enter()
        .append('text')
        .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')' })
        .attr('text-anchor', 'middle')
        .text(function(d) { return d.value })
        .style('font-size', '18px');
}