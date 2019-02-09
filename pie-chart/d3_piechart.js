function draw_pie(config) {
    console.log('config', config)

    const divId = config.div_id,
        chartId = config.chart_id,
        margin  = config.margin,
        w       = $(divId).width();

    $(divId).html('') // delete all content of div container

    const color = d3.scale.linear()
        .domain([0, config.data.length])
        .range(['#FF3112', '#1231FF']);

    const outerRadius = (w - margin.left - margin.right) / 2,
        innerRadius = 0,
        h = 2 * outerRadius + margin.top + margin.bottom;

    const pie = d3.layout.pie()
        .value(function(d){ return d.value });

    const arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // bigger outerRadius for mouseover transition
    const arcMouseOver = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.05);

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
            const _this = this,
                children = _this.__data__.data.children;

            if (children !== undefined) {
                config.data = children;
                draw_pie(config)

            } else {
                // console.log('the end')
                // console.log('this', this)
                // console.log('parentElement', this.parentElement)
                // config.data = this.parentElement.__data__.data.children
                draw_pie(config)

            }

        });

    arcs.append('text')
        .attr('transform', function(d) { return `translate(${arc.centroid(d)})`})
        .text(function(d) { return `${d.data.label} (${d.value})`})
        .attr('text-anchor', 'middle')
        .style('font-size', '14px');

    arcs.each(addDataToArc)

    function addDataToArc(d, i){
        console.log('d, i =', d, i)
    }
}
