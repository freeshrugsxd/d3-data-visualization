function draw_pie(configs, side) {

    let config  = side === 'l' ? configs.left : configs.right,
        divId   = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        objArr  = [],
        w       = $(divId).width();

    $(divId).html('') // delete all content of div container

    // write json objects into array
    Object.keys(config.data).forEach(function(key) {
        objArr.push(config.data[key])
    })

    let color = d3.scale.linear()
        .domain([0, objArr.length])
        .range(['#FF3112', '#1231FF']);

    let outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    let pie = d3.layout.pie()
        .value(function(d){ return d3.sum(d3.values(d)) });

    let arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // arc generator with slightly bigger radius
    // for mouseover transition
    let arcMouseOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.05)

    // x and y coords of the pie chart centre
    let cx = outerRadius + margin.left,
        cy = outerRadius + margin.top,

    // create svg area
    let svg = d3.selectAll(divId)
        .append('svg')
        .attr({id : chartId, width : w, height : h})
        .append('g')
        .attr('transform', 'translate(' + cx + ',' + cy + ')')

    // append group for each datum in objArr
    let arcs = svg.selectAll('.arc')
        .data(pie(objArr))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) { return color(i) })
        .style('stroke', 'white')
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
                .ease('bounce')
                .delay(100)
                .duration(500)
                .attr('d', arc);
        })
        .on('click', function() {
            let arcData = this.__data__.data
            configs.right.data = []
            // create array of objects
            Object.keys(arcData).forEach( function(key) {
                configs.right.data.push({key : arcData[key]})
            })
            draw_pie(configs, 'r')
        });

    arcs.append('text')
        .attr('transform', function(d) {
            return 'translate(' + arc.centroid(d) + ')'
        })
        .text(function(d) { return d.value })
        .attr('text-anchor', 'middle')
        .style('font-size', '20px');
}
