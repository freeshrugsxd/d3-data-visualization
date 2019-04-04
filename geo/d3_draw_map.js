function draw_map(config) {
  let divClass = config.div_class,
    mapClass = `map_${divClass}`,
    boundClass = `bounds_${mapClass}`,
    divClassSel = `.${divClass}`,
    mapClassSel = `.${mapClass}`,
    boundClassSel = `.${boundClass}`,
    width  = $(divClassSel).width(),
    height = config.height,
    showGrid = config.graticule,
    rotation = config.rotation || [0, 0],
    n = config.features.length
    config.scale = 1,
    pi = Math.PI;

  $(divClassSel).html('')

  let zoom = d3.behavior.zoom()
    .scaleExtent([1, 25])
    .on('zoom', panAndZoom)

  let svg = d3.select(divClassSel)
    .append('svg')
      .attr({ width: width, height: height })
      .call(zoom);

  let mainGrp = svg.append('g')

  const projections = {
    mercator : d3.geo.mercator().scale(width / 3 / pi),
    equirect : d3.geo.equirectangular().scale(width / 2 / pi),
    globe    : d3.geo.orthographic()
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
      .style({
        fill: 'white',
        stroke: '#777',
        'stroke-width': '.5px',
        'stroke-opacity': 0.5
      });
  }


  // add country boundaries
  let bounds = mainGrp.selectAll(boundClassSel)
    .data(config.features)
    .enter()
      .append('path')
        .attr('class', boundClass)
        .attr('d', path)
        .style({ fill: 'silver', stroke: 'white' });

  let max = 0
  for (let i in config.features) {
    max = Math.max(max, config.features[i].properties.pop_est)
  }

  let maxRad = 25

  let rad = d3.scale.pow()
    .range([2, maxRad])
    .domain([0, max])

  let radii = Array(n),
      nodes = Array(n);

  let quadtree = d3.geom.quadtree()
    .x(d => d.x)
    .y(d => d.y)


  function update(config) {

    // add random data to features
    config.features.map( function(d, i) {
      nodes[i] = {}
      nodes[i].index = i
      nodes[i].count = 1

      xy = path.centroid(d)

      nodes[i].x = xy[0]
      nodes[i].y = xy[1]
      nodes[i].r = nodes[i].count * 10 / Math.sqrt(config.scale)
      nodes[i].a = pi * [nodes[i].r * nodes[i].r]

      radii[i] = nodes[i].r
    })

    // for (let i in nodes) {
    //   nodes[i].r = rad(nodes[i].r) / config.scale
    // }

    qtree = quadtree(nodes)
    console.log('qtree', qtree)

    // draw qtree:
    // mainGrp.selectAll('rect').remove()
    //   qtree.visit( function(quad, x0, y0, x1, y1) {
    //     mainGrp.append('rect')
    //       .attr('transform', `translate(${x0}, ${y0})`)
    //       .attr({
    //         height: `${x1 - x0}px`,
    //         width : `${y1 - y0}px`,
    //         fill  : 'none',
    //         stroke : 'black'
    //       })
    //       .style('opacity', 0.6)
    //   })

    for (let i in nodes) {
      n1 = nodes[i]
      cx = n1.x
      cy = n1.y
      ra = radii[n1.index]

      search(qtree, cx, cy, ra)
    }

    mainGrp.selectAll('circle').remove()
    // add circles on top of the map
    let circs = mainGrp.selectAll('circle')
      .data(nodes)
      .enter()
        .append('circle')
          .attr('class', 'circClass')
          // set radius depending on your data (e.g. estimated population)
          .attr({
            r: d => d.r,
           cx: d => d.x || -9999,
           cy: d => d.y || -9999,
          fill: function(d) {
            let col = 'green'
            if (d.count > 3) col = 'blue'
            if (d.count > 5) col = 'red'
            return col
          },
          stroke: 'black',
          'stroke-width': `${0.5/Math.sqrt(config.scale)}px`,
          })
          .style('opacity', 0.7)

    circs.on('click', function(d, i) {
      console.log('count', this.__data__.count)
      console.log('index', this.__data__.index)
      console.log('data', this.__data__)
    })


    let label = mainGrp.append('g')
    mainGrp.selectAll('text').remove()
    label.selectAll('text')
      .data(nodes)
      .enter()
        .append('text')
        .text(function(d) {
          if (d.r > 0) return `${d.count}`
        })
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('font-size', d => `${10 / Math.sqrt(config.scale)}px`)
  }


  // Find the nodes within the specified rectangle.
  function search(quadtree, cx, cy, ra) {
    quadtree.visit(function(quad, x0, y0, x1, y1) {
      let n2 = quad.point,
          r  = ra;

      if (n2) {
        if (n2.index > n1.index && n1.a && n2.a) {
          let x = cx - n2.x,
              y = cy - n2.y,
              r = n2.r + ra,
              a, b;

          if (x * x + y * y < r * r) {

            n1.collided = true
            n2.collided = true

            if (n2.a > n1.a) a = n2, b = n1;
            else             a = n1, b = n2;

            a.x = (a.x * a.a + b.x * b.a)/(a.a + b.a)
            a.y = (a.y * a.a + b.y * b.a)/(a.a + b.a)

            a.count++
            a.a += b.a
            a.r = Math.sqrt(a.a / pi)

            b.a = 0
            b.r = 0
          }
        }

        return

      }

    return x0 > cx + r || x1 < cx - r || y0 > cy + r || y1 < cy - r

    });
  }

  function panAndZoom() {
    let t = d3.event.translate,
        s = d3.event.scale

    mainGrp.attr('transform', `translate(${t})scale(${s})`);
    bounds.style('stroke-width', `${1/Math.sqrt(s)}px`)

    if (config.scale != s) {
      config.scale = s
      update(config)
    }
  }

  update(config)
}
