function draw_ts(configs) {
    console.log('configs', configs)

    let divId = '#chart',
        w = $(divId).width(),
        h = configs.ref_height
        margin = configs.margin
        data = configs.data
        label = configs.data['Label']

    delete data.Label
    console.log(data)
    $(divId).html('')

    let x = d3.scale.linear()
        .range([0, w])
        .domain(d3.extent(data, function(d) {
            console.log('holy shit d', d);
            return Number(d[0]);
        })),
        y = d3.scale.linear()
            .range([h, 0])
            .domain([0, d3.max(data, function(d) { return Number(d[1])})]);

    let xAxis = d3.svg.axis().scale(x)
        .orient('bottom');

    let yAxis = d3.svg.axis().scale(y)
        .orient('left');

    let valueLine = d3.svg.line()
        .x(function(d) { console.log('x(d[0])', d[0]); return x(Number(d[0])); })
        .y(function(d) { console.log('x(d[1])', d[1]); return y(Number(d[1])); })

    let svg = d3.selectAll(divId)
        .append('svg')
            .attr({ width : w, height : h, id : 'lineGraph'})
        .append('g')
            // .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("path")
        .attr("class", "line")
        .attr("d", valueLine(Object.entries(data)));

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}