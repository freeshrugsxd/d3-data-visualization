function draw_pie(configs, side) {

    config = side == 'l' ? configs.left : configs.right
    let divId   = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        objArr  = [],
        w       = $(divId).width()

    $(divId).html("") // delete all content of div container

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

        .on('click', function() {
            let arcData = this.__data__.data
            configs.right.data = []
            // create array of objects
            Object.keys(arcData).forEach( function(key) {
                configs.right.data.push({key : arcData[key]})
            })
            draw_pie(configs, 'r')
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
