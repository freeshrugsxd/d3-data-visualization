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
      pi = Math.PI;

  let provs = config.features.provinces,
      cntrs = config.features.countries;

  config.scale = 1

  $(divClassSel).html('')

  let zoom = d3.behavior.zoom()
    .scaleExtent([0, 150])
    .on('zoom', panAndZoom);

  let svg = d3.select(divClassSel)
    .append('svg')
      .attr({ width: width, height: height })
      .call(zoom);

  let mainGrp = svg.append('g');

  // projection library:
  const projections = {
    mercator : d3.geo.mercator().scale(width / 3 / pi),
    equirect : d3.geo.equirectangular(),
    globe    : d3.geo.orthographic()
                 .clipAngle(90)
                 .scale(200)
                 .rotate([0, -25]),
  };

  let proj = projections[config.projection]
    .translate([width / 2, height / 2])
    .rotate(rotation);

  // convenience function to draw boundaries
  let path = d3.geo.path()
    .projection(proj);

  if (showGrid) {
    // draw a graticule in the background
    let grid = d3.geo.graticule();

    mainGrp.append('path')
      .datum(grid)
      .attr('d', path)
      .style({
        stroke: '#777',
        'stroke-width': '.5px',
        'stroke-opacity': 0.5
      })
  }

  let scaleRad = d3.scale.pow()
    .domain([2, 30])
    .range([1, 6])

  // add boundaries for smaller administrative areas (provinces)  
  let provinces = mainGrp.selectAll(`${boundClassSel}_prov`)
    .data(provs)
    .enter()
      .append('path')
        .attr('class', boundClass)
        .attr('d', path)
        .style({ fill: 'silver', stroke: 'white' })
        .style('visibility', 'hidden')

  // add boundaries for country level of detail
  let countries = mainGrp.selectAll(`${boundClassSel}_country`)
    .data(cntrs)
    .enter()
      .append('path')
        .attr('class', boundClass)
        .attr('d', path)
        .style({ fill: 'silver', stroke: 'white' });

  // convenience function to calculate the quadtree
  let quadtree = d3.geom.quadtree()
    .x(d => d.x)
    .y(d => d.y)

  /* create temporary array which will hold the point information
  during each update. this way we do not change the original data
  stored in config.data */
  let points = Array(config.data.length)

  function update(config) {

    let data = config.data
    
    // populate points array with our data
    data.map( function(d, i) {
      points[i] = {}
      points[i].index = i
      points[i].count = 1

      // assign radius and x & y coords
      // we want r to become smaller when we zoom in, so the clusters will loosen up
      points[i].r = scaleRad(d.properties.value) * (1 / Math.sqrt(config.scale))

      // the data is stored as WGS84 lat/lon, so we need to project them
      // to our local coordinate system
      points[i].x = proj(d.geometry.coordinates)[0]
      points[i].y = proj(d.geometry.coordinates)[1]

      // calculate the area of the circle
      points[i].a = pi * (points[i].r * points[i].r)
    })

    // create quadtree
    qtree = quadtree(points)
    
    // uncomment this part to visualize the quadtree geometry:
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
    //   })

    // only leaf nodes have points stored in them. 
    let next = [];

    // https://github.com/d3/d3-3.x-api-reference/blob/master/Quadtree-Geom.md#visit
    qtree.visit(function(quad) {
      // push all quadrats into an array
      next.push(quad)
    })

    while (quad = next.pop()) {
      // take last item of the array and check if its a leaf
      if (quad.point) {
        quad.r = quad.point.r
        // jump to next iteration if quad has a point attached
        continue
      }
      // if quad is not a leaf, iterate over its children
      // and determine the biggest radius inside the current quad
      for (let i = quad.r = 0; i < 4; ++i) {
        if (quad.nodes[i] && quad.nodes[i].r > quad.r) {
          quad.r = quad.nodes[i].r
        }
      }
    }
    //
    for (let i in points) {
      n1 = points[i]
      cx = n1.x
      cy = n1.y
      r1 = n1.r

      // visit each node in the quadtree
      qtree.visit(function(quad, x0, y0, x1, y1) {
        let n2 = quad.point,
            r  = r1 + quad.r;

        if (n2) {
          if (n2.index > n1.index && n1.a && n2.a) {
            let x = cx - n2.x,
                y = cy - n2.y,
                a, b;

            // check for circle-circle intersection
            // http://mathworld.wolfram.com/Circle-CircleIntersection.html
            if (x * x + y * y < r * r) {

              // figure out which circle is the bigger one (by area)
              if (n2.a > n1.a) {
                a = n2
                b = n1
              }
              else {
                a = n1
                b = n2
              }

              // calculate new weighted center point of merged circle
              a.x = (a.x * a.a + b.x * b.a) / (a.a + b.a)
              a.y = (a.y * a.a + b.y * b.a) / (a.a + b.a)

              // add count of absorbed circle
              a.count += b.count
              a.a += b.a
              a.r = Math.sqrt(a.a / pi)

              b.a = 0
              b.r = 0
            }
          }
        }
      // check if circle lies outside of the quad's bounding box
      // if this returns true, child nodes of the quad are not going to be visited
      return x0 > cx + r || x1 < cx - r || y0 > cy + r || y1 < cy - r

      })
    }

    mainGrp.selectAll('circle').remove()
    // add circles on top of the map
    let circs = mainGrp.selectAll('circle')
      .data(points)
      .enter()
        .append('circle')
          .attr('class', 'circClass')
          .attr({
            r : d => d.r,
            cx: d => d.x || -1e9, // off the viewport if its on the
            cy: d => d.y || -1e9, // far side of the globe
            fill: function(d) {
              let col = 'green'
              if (d.count > 3) col = 'blue'
              if (d.count > 5) col = 'red'
              return col
            },
            stroke: 'black',
            'stroke-width': `${0.5/Math.sqrt(config.scale)}px`,
          })
          .style('opacity', 0.7);
/* 
    circs.on('click', function() {
      console.log('count', this.__data__.count)
      console.log('index', this.__data__.index)
      console.log('data', this.__data__)
    })
*/    

/* 
    let label = mainGrp.append('g');
    mainGrp.selectAll('text').remove()
    label.selectAll('text')
      .data(points)
      .enter()
        .append('text')
        .text(function(d) {
          if (d.r > 0) return `${d.count}`
        })
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('font-size', () => `${10 / Math.sqrt(config.scale)}px`)
*/      
  }

  function panAndZoom() {
    let t = d3.event.translate,
        s = d3.event.scale;

    mainGrp.attr('transform', `translate(${t})scale(${s})`)

    if (config.scale != s) {

      // turn visibility of the different boundary layer on and off
      // based on current scale
      if (config.scale <= 5) {
        countries.style('visibility', 'visible')
        provinces.style('visibility', 'hidden')
      } else {
        countries.style('visibility', 'hidden')
        provinces.style('visibility', 'visible')
      }
      countries.style('stroke-width', `${1/Math.sqrt(s)}px`)
      provinces.style('stroke-width', `${1/Math.sqrt(s)}px`)

      config.scale = s
      update(config)
    }
  }

  update(config)
}
