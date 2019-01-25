function draw_left(config) {

    let divId   = config.left.div_id,
        chartId = config.left.chart_id,
        margin  = config.left.margin,
        objArr  = [],
        w       = $(divId).width()

    $(divId).html("") // delete all content of div container

    // write json objects into array
    Object.keys(config.left.data).forEach(function(key) {
        objArr.push(config.left.data[key])
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
            config.right.data = []
            // create array of objects
            Object.keys(arcData).forEach( function(key) {
                config.right.data.push({key : arcData[key]})
            })
            draw_right(config)
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

function draw_right(config) {

    let divId   = config.right.div_id,
        chartId = config.right.chart_id,
        margin  = config.right.margin,
        objArr  = [],
        w       = $(divId).width()

    $(divId).html("") // delete all content of div container

    // write json objects into array
    Object.keys(config.right.data).forEach(function(key) {
        objArr.push(config.right.data[key])
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
            config.right.data = []
            // create array of objects
            Object.keys(arcData).forEach( function(key) {
                config.right.data.push({key : arcData[key]})
            })
            draw_right(config)
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