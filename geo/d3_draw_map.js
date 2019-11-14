function draw_map(config) {
  const divId = config.div_id,
    divIdSel  = `#${divId}`,
    mapId     = `map_${divId}`,

    circClass    = `${mapId}_circle`,
    circClassSel = `.${circClass}`,

    infoClass = `${mapId}_infoBox`,
    infoClassSel = `.${infoClass}`,

    ttipClass    = `tooltip_${divId}`, // class name for tooltip div element
    ttipClassSel = `.${ttipClass}`, // selector for tooltip div element

    BBoxAttr = `${divId}-BBox`, // name for the bbox attribute

    width = config.width || $(divIdSel).width(),
    opacity = config.opacity || 1,
    height = config.height,
    my_tile = config.tile,
    circCol = config.color,
    circStroke = config.stroke,

    pi = Math.PI;

  let scale = 0;

  $(divIdSel).html('')

  // projection library:
  const projections = {
    mercator: d3.geo.mercator(),
    equirect: d3.geo.equirectangular(),
  };

  // http://bl.ocks.org/jasondavies/0051a06829e72b423ba9
  // determine x index of wrapped tiles east and west of the original map
  const wrapX = d => (d[0] % (1 << d[2]) + (1 << d[2])) % (1 << d[2]),
    rndrange  = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

  const tile_urls = {
    // https://wiki.openstreetmap.org/wiki/Tiles
    dark:  d => `https://cartodb-basemaps-${rndrange(1,4)}.global.ssl.fastly.net/dark_all/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    light: d => `https://cartodb-basemaps-${rndrange(1,4)}.global.ssl.fastly.net/light_all/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    ocean: d => `https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/${d[2]}/${d[1]}/${wrapX(d)}.png`,
    wiki:  d => `https://maps.wikimedia.org/osm-intl/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    bw:    d => `https://tiles.wmflabs.org/bw-mapnik/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    meeks: d => `http://a.tiles.mapbox.com/v3/elijahmeeks.map-zm593ocx/${d[2]}/${wrapX(d)}/${d[1]}.png`
  };

  // convenience function to project any data to the specified projection
  // mercator scale: https://www.wikiwand.com/en/Mercator_projection#/Alternative_expressions
  let proj = projections[config.projection]
    .scale(width / 2 / pi)
    .translate([width / 2, height / 2])

  let center = proj([0, 15]) // center map on North Africa/Europe

  // initiate tiles
  // overflow method thanks to Jason Davies (http://bl.ocks.org/jasondavies/0051a06829e72b423ba9)
  let tile = d3.geo.tile()
    .size([width, height])
    .overflow([true, false]);

  // initiate zoom and center map
  let zoom = d3.behavior.zoom()
    .scale(proj.scale() * 2 * pi)
    .scaleExtent([width, 1 << 20])
    .translate([width - center[0], height - center[1]])
    .on('zoom', zoomed);

  // recenter projection after zoom is configured to make it work correctly when
  // scaling and translating our circles
  proj.translate([0, 0])

  let svg = d3.select(divIdSel)
    .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('outline', 'gray solid 1px')
      .call(zoom)

  // svg groups in the order in which they are drawn
  let raster = svg.append('g'), // tile images
      vector = svg.append('g'), // circles
      info   = svg.append('g'); // info box

  // info box to show cursor coordinates
  info.append('rect')
    .attr({
      width: 150,
      height: 16,
      fill: 'white'
    })
    .style('opacity', 0)

  let infoText = info.append('text')
    .attr('transform', 'translate(5,12)')
    .attr('cursor', 'default')

  svg.on('mouseout', function () {
    infoText.text('')
    info.selectAll('rect')
      .style('opacity', 0)
  })

  // this should be tweaked to get the radii right
  let scaleRad = d3.scale.sqrt()
    .domain([50, 50000])
    .range([2.2, 15])

  // convenience function to calculate the quadtree
  let quadtree = d3.geom.quadtree()
    .x(d => d.x)
    .y(d => d.y)

  zoomed()

  function update(config) {
    // on every update: calculate the clustered markers and draw them as circles onto the map
  let t = zoom.translate();

  if (scale == 0) {
      // create initial bounding box object

      config[BBoxAttr] = {
        left:   -t[0],
        top:    -t[1],
        right:  width  - t[0],
        bottom: height - t[1]
      };
    }

    $(ttipClassSel).remove() // remove all leftover tooltips on redraw

    // define tooltip (coords are declared later on mouse events)
    const tooltip = d3.select('body')
      .append('div')
        .attr('class', ttipClass)
        .style({
          'position': 'absolute',
          'z-index': '20',
          'visibility': 'hidden',
          'font-weight': 'bold',
          'font-size': '10px',
          'color': '#000',
          'line-height': 1,
          'padding': '5px',
          'background': '#fff',
          'border-radius': '2px',
          'opacity': 0.8
        })

    // display cursor position in info box
    svg.on('mousemove', function () {
      mx = d3.mouse(this)[0]
      my = d3.mouse(this)[1]

      // re-project px to coords
      ll = proj.invert([mx - t[0], my - t[1]])

      lon = `${Math.abs(Math.round(ll[0] * 1000) / 1000)}${ll[0] > 0 ? '°E' : '°W'}`
      lat = `${Math.abs(Math.round(ll[1] * 1000) / 1000)}${ll[1] > 0 ? '°N' : '°S'}`

      if (Number(lon.split('°')[0]) <= 180) {
        info.selectAll('rect')
        .style('opacity', 0.4)

        infoText.text(`${lat}, ${lon}`)
      }
    })


    let data = config.data.features,
      points = [];

    // populate points array with our data
    data.forEach(function (d) {

      // get projected pixel coordinates from lat/lon
      let point = {
        x: proj(d.geometry.coordinates)[0],
        y: proj(d.geometry.coordinates)[1]
      }

      if (within_BBox(point, config[BBoxAttr])) {
        point.index = points.length
        point.count = d.properties.num_products
        point.r = scaleRad(d.properties.num_products) // assign scaled radius

        point.a = pi * (point.r * point.r) // calculate the area of the circle
        points.push(point)
      }
    })

    /* 
    The following algorithm is used to find and assign the maximum circle radii
    for every node in the quadtree. Only leaf nodes have a point object
    attached, which holds the radius for the corresponding point. Our goal is to
    find the maximum radius of all circles inside a node and all of its child
    nodes. To do this, we first store all the nodes in an array and then start
    to work our way through the nodes in Post-Order and hand the radius of the
    leaf nodes upwards to their parent nodes. Since the array consists of
    references to the original objects inside the node, all modifications made
    to them will be present in the original node. (variable: qtree)
    (https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/)
    */

    let qtree = quadtree(points), // calculate quadtree
        next  = [];

    // traverse the quadtree in Pre-Order and push all nodes into an array
    qtree.visit(function (quad) {
      next.push(quad)
    })

    /*
    Since d3v3 does not have a visitAfter()-method, like more recent versions
    do, (https://github.com/d3/d3-quadtree/blob/master/src/visitAfter.js) which
    traverses the quadtree in post-order, we have to implement one ourselves. I
    am basically just taking the last element of the array, while there still is
    one, and check if it is a leaf node. If so, take the point's radius and
    assign it to its parent node. If it's not a leaf node, check it for child
    nodes, take the biggest of their radii and assign it to the current node.
    Every node can only have up to four (4) child nodes (topleft, topright,
    bottomleft, bottomright).
    */

    let quad;

    // take last item of the array and check if its a leaf
    while (quad = next.pop()) {
      if (quad.point) {
        // assign radius attribute to node and continue with next iteration
        quad.r = quad.point.r
        continue
      }

      // if quad is not a leaf, iterate over its children and determine the
      // biggest radius
      for (let i = quad.r = 0; i < 4; ++i) {
        if (quad.nodes[i] && quad.nodes[i].r > quad.r) {
          // assign largest child radius to quad
          quad.r = quad.nodes[i].r
        }
      }
    }

    /*
    The following algorithm implements the clustering of circles that are
    intersecting. Parts of the code are generously borrowed from and/or hugely
    inspired by Andrew Reid's excellent Marker Clustering example
    (https://bl.ocks.org/Andrew-Reid/21ff4b57267fa91dacc57ef1ccb7afb3) and his
    d3-fuse library (https://github.com/Andrew-Reid/d3-fuse). For every point in
    our data, visit each node in the quadtree and check if the point lies within
    or within one radius distance of the quadrat. If this is not the case, that
    node's child nodes will not be visited.
    (https://github.com/d3/d3-3.x-api-reference/blob/master/Quadtree-Geom.md#visit)
    */

    let oldLen = 0;
    while (true) {
      for (let i in points) {
        let p1 = points[i]
        // visit each node in the quadtree
        qtree.visit(function (quad, x0, y0, x1, y1) {

          let p2 = quad.point,
            r = p1.r + quad.r,
            rr = r + r;

          if (p2) {
            if (p2.index != p1.index && p1.a && p2.a) {
              let a, b,
                x = p2.x - p1.x,
                y = p2.y - p1.y;               

              // check for circle-circle intersection
              if (Math.sqrt(x * x + y * y) <= (p1.r + p2.r)) {

                // figure out which circle is the bigger one (by area)
                if (p2.a > p1.a) {
                  a = p2
                  b = p1
                } else {
                  a = p1
                  b = p2
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
          /*
          Check if circle lies outside of the quad's bounding box. If this
          returns true, child nodes of the quad are not going to be visited. The
          combined radius r is used as a buffer, since a point can lie near or
          on the boundary of a quadrat.
          */
          return x0 > p1.x + rr || x1 < p1.x - rr || y0 > p1.y + rr || y1 < p1.y - rr
        })
      }

      points = points.filter(d => d.r != 0) // remove absorbed circles from array
      if (points.length == oldLen) break // stop while loop if number of points didn't change
      oldLen = points.length // save number of points for next iteration
    }

    vector.selectAll(circClassSel).remove()

    // add circles to the map
    let circs = vector.selectAll(circClassSel)
      .data(points)
      .enter()
        .append('circle')
          .attr('class', circClass)
          .attr({
            r: d => d.r,
            cx: d => d.x,
            cy: d => d.y,
            fill: circCol,
            stroke: circStroke,
            opacity: opacity
          })

    circs.on('mousemove', function (d) {
      tooltip.html(d.count > 1000 ? `${parseInt(d.count / 1000)}k` : d.count)
        .style({
          top:  `${d3.event.pageY + 15}px`,
          left: `${d3.event.pageX + 10}px`,
          'pointer-events': 'none',
          visibility: 'visible'
        })
      })
      .on('mouseout', function () {
        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
      })
  }
  

  function zoomed() {
    // On zoom: move and scale background tiles and circles appropriately
    let t = zoom.translate(),
        s = zoom.scale();

    // create new bounding box object for current view
    config[BBoxAttr] = {
        left: -t[0],
         top: -t[1],
       right: width  - t[0],
      bottom: height - t[1]
    };

    let tiles = tile.scale(s).translate(t)()

    proj.scale(s / 2 / pi)

    vector.attr('transform', `translate(${t[0]} , ${t[1]})`)

    image = raster.attr('transform', `scale(${tiles.scale})translate(${tiles.translate})`)
      .selectAll('image')
      .data(tiles, d => d)

    image.exit().remove()

    image.enter()
      .append('image')
        .attr('xlink:href', tile_urls[my_tile])
        .attr('width', 1)
        .attr('height', 1)
        .attr('x', d => d[0])
        .attr('y', d => d[1])


    scale = s
    dataSub = s <= 2000 ? 'continents' : s > 2000 && s < 11000 ? 'countries' : 'footprints'
    config.data = config.data_obj[dataSub]
    update(config)
  }

  function within_BBox(p, BBox) {
    // check if a point lies within a (buffered) bounding box object
    let buffer  = 0.1;

    return p.x >= BBox.left   - width  * buffer &&
           p.x <= BBox.right  + width  * buffer &&
           p.y >= BBox.top    - height * buffer &&
           p.y <= BBox.bottom + height * buffer
  }

}
