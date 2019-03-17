function draw_map(config) {
  let divClass = config.div_class,
    mapClass = `map_${divClass}`,
    boundClass = `bounds_${mapClass}`,
    divClassSel = `.${divClass}`,
    mapClassSel = `.${mapClass}`,
    boundClassSel = `.${boundClass}`,
    width  = $(divClassSel).width(),
    height = config.height;
    showGrid = config.graticule,
    rotation = config.rotation || [0, 0]

  $(divClassSel).html('')

  // define tooltip (coords are declared later on mouse events)
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', 'ttipClass')
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

  let zoom = d3.behavior.zoom()
    .scaleExtent([1, 5])
    // .on('zoom', panAndZoom)

  let svg = d3.select(divClassSel)
    .append('svg')
      .attr({width: width, height: height})
      .call(zoom);

  let mainGrp = svg.append('g')

  const projections = {
    mercator : d3.geo.mercator()
                 .scale((width + 1) / 2 / Math.PI),
       globe : d3.geo.orthographic()
                 .clipAngle(90)
                 .scale(200)
                 .rotate([0, -25]),
  };


  let proj = projections[config.projection]
    .translate([width / 2, height / 2])
    .rotate(rotation)

  let path = d3.geo.path()
    .projection(proj);

  if (showGrid) {
    let grid = d3.geo.graticule();

    mainGrp.append('path')
      .datum(grid)
      .attr('d', path)
      .style({ fill: 'white',
               stroke: '#777',
               'stroke-width': '.5px',
               'stroke-opacity': 0.5 });
  }

  let bounds = mainGrp.selectAll(boundClassSel)
    .data(config.features)
    .enter()
      .append('path')
        .attr('class', boundClass)
        .attr('d', path)
        .style({fill: 'black', stroke: 'white'});

  if (config.projection == 'globe') {
    let scaleLon = d3.scale.linear()
      .domain([0, width])
      .range([-180, 180]);

    let scaleLat = d3.scale.linear()
      .domain([0, height])
      .range([90, -90]);

   mainGrp.on('mousedown', function() {
    mainGrp.on('mousemove', function() {
      let p = d3.mouse(this);

      proj.rotate([scaleLon(p[0]), scaleLat(p[1])]);
      mainGrp.selectAll('path')
        .attr('d', path);
    })
  })

  mainGrp.on('mouseup', function() {
    mainGrp.on('mousemove', null)
  })
}
  bounds.on('click', function(d) {
      console.log('d, this', d, this)
    })
    .on('mouseover', function() {
      d3.select(this)
        .style('fill', 'green')
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('fill', 'black')
    })


  function panAndZoom() {
    let t = d3.event.translate,
      s = d3.event.scale,
      x = Math.min((width / height) * (s - 1), Math.max(width * (1 - s), t[0])),
      h = height / 4,
      y = Math.min(h * (s - 1) + h * s, Math.max(height * (1 - s) - h * s, t[1]));

    mainGrp.attr('transform', `translate(${x},${y})scale(${s})`);
  }



}
