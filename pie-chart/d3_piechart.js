function draw_pie(config) {

    let divId   = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        keys    = [],
        w       = $(divId).width();

    $(divId).html('') // delete all content of div container

    let color = d3.scale.linear()
        .domain([0, config.data.length])
        .range(['#FF3112', '#1231FF']);

    let outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    let pie = d3.layout.pie()
        .value(function(d){ return d3.sum(d3.values(d.values)) });

    let arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // bigger outerRadius for mouseover transition
    let arcMouseOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.05);

    // x and y coords of the pie chart centre
    let cx = outerRadius + margin.left,
        cy = outerRadius + margin.top;

    // create svg area
    let svg = d3.selectAll(divId)
        .append('svg')
        .attr({id : chartId, width : w, height : h})
        .append('g')
        .attr('transform', `translate(${cx}, ${cy})`);

    // append group for each datum in config.data
    let arcs = svg.selectAll('.arc')
        .data(pie(config.data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) { return color(i) })
        .style('stroke', 'white')
        .style('stroke-width', '2px')
        // transitions on mouseover and mouseout
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
            let arcData = this.__data__.data
            config.data = []
            Object.keys(arcData.values).forEach( function(key) {
                config.data.push({ key: key,
                                   values: [arcData.values[key]]})
            })
            draw_pie(config)
        });

    arcs.append('text')
        .attr('transform', function(d) { return `translate(${arc.centroid(d)})`})
        .text(function(d) { return `${d.data.key} (${d.value})`})
        .attr('text-anchor', 'middle')
        .style('font-size', '14px');
}
