function draw_map(config) {
  let divClass = config.div_class,
      mapClass = `map_${divClass}`,
      boundClass = `bounds_${mapClass}`,
      divClassSel = `.${divClass}`,
      boundClassSel = `.${boundClass}`,
      width = $(divClassSel).width(),
      height = config.height,
      pi = Math.PI;

  config.scale = 1024

  $(divClassSel).html('')

  // projection library:
  const projections = {
    mercator : d3.geo.mercator().scale(164),
    equirect : d3.geo.equirectangular(),
    globe    : d3.geo.orthographic()
                 .clipAngle(90)
                 .scale(200)
                 .rotate([0, -25]),
  };

  // convenience function to project any data to the specified projection
  let proj = projections[config.projection]
    .scale(width / 2 / Math.PI)
    .translate([width / 2, height / 2])


  // convenience function to draw boundaries
  let path = d3.geo.path()
    .projection(proj)

  let center = proj([0, 15])

  let tile = d3.geo.tile()
      .size([width, height]);

  let zoom = d3.behavior.zoom()
    .scale(proj.scale() * 2 * Math.PI)
    .scaleExtent([1024, 1 << 16])
    .translate([width - center[0], height - center[1]])
    .on('zoom', zoomed);

  let svg = d3.select(divClassSel)
    .append('svg')
      .attr({ width: width, height: height })
      .call(zoom);

  let raster = svg.append('g'),
      vector = svg.append('g');

  let scaleRad = d3.scale.pow()
    .domain([1, 100])
    .range([1, 10])
  
  // convenience function to calculate the quadtree
  let quadtree = d3.geom.quadtree()
    .x(d => d.x)
    .y(d => d.y)

  update(config)
  zoomed()
  function zoomed() {

    let t = zoom.translate(),
        s = zoom.scale();

    let tiles = tile.scale(s).translate(t)()

    proj.translate([0, 0])
        .scale(s / 2 / pi)

    vector.attr('transform', `translate(${t[0]} , ${t[1]})`)

    image = raster.attr('transform', `scale(${tiles.scale})translate(${tiles.translate})`)
      .selectAll('image')
        .data(tiles, d => d)

    image.exit().remove()

    image.enter()
      .append('image')
        .attr('xlink:href', d => `https://tiles.wmflabs.org/bw-mapnik/${d[2]}/${d[0]}/${d[1]}.png`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('x', d => d[0])
        .attr('y', d => d[1])

    if (config.scale != s) {
      config.scale = s
      update(config)
    }
  }


  // update the map after zooming in
  function update(config) {

    let data = config.data.features,
      points = Array(data.length);

    // populate points array with our data
    data.map( function(d, i) {
      points[i] = {}
      points[i].index = i
      points[i].count = 1

      // assign radius and x & y coords
      // we want r to become smaller (or stay the same, propotionally) when we zoom in
      points[i].r = scaleRad(d.properties.value * 2)

      // the data is stored as WGS84 lat/lon, so we need to project them
      // to our local coordinate system (x, y)
      points[i].x = proj(d.geometry.coordinates)[0]
      points[i].y = proj(d.geometry.coordinates)[1]

      // calculate the area of the circle
      points[i].a = pi * (points[i].r * points[i].r)
    })

    // create quadtree
    qtree = quadtree(points)
    
    /* The following algorithm is used to find and assign the maximum circle radii for 
      every quadrat in the quadtree. Only leaf nodes have a point object attached, 
      which holds the radius for the corrisponding point. Our goal is to find the 
      maximum radius of all circles inside a quadrat (node) and all of its child nodes.
      To do this, we first store all the nodes in an array and then start to work our
      way through the nodes in Post-Order (https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/)
      and hand the radius of the leaf nodes upwards to their parent nodes. Since the array
      consists of references to the original objects inside the quadtree, all modifications
      made to them will be present in the quadtree object. (variable: qtree)
    */ 

    let next = [];
    // travers the quadtree in Pre-Order and push all nodes into an array
    qtree.visit(function(quad) {
      next.push(quad)
    })

    /* Since d3v3 does not have a visitAfter()-method, like more recent versions do,
      (https://github.com/d3/d3-quadtree/blob/master/src/visitAfter.js) which traverses 
      the quadtree in post-order, we have to implement one ourselves. I am basically just
      taking the last element of the array, while there still is one, and check if it is
      leaf node. If it is, take the point's radius and assign it to the quadrat which
      contains it. If it's not a leaf node, check the quadrat for child nodes, take the
      biggest of their radii and assign it to the current quadrat. Every quadrat can only
      have up to four (4) child nodes (topleft, topright, bottomleft, bottomright).
    */

    // take last item of the array and check if its a leaf
    while (quad = next.pop()) {
      quad.visitedBy = []
      if (quad.point) {
        // assign radius attribute to quadrat and continue with next iteration
        quad.r = quad.point.r
        continue
      }
      // if quad is not a leaf, iterate over its children and determine the biggest radius
      for (let i = quad.r = 0; i < 4; ++i) {
        if (quad.nodes[i] && quad.nodes[i].r > quad.r) {
          quad.r = quad.nodes[i].r
        }
      }
    }

    /* The following algorithm implements the clustering of circles that are intersecting.
      Parts of the code are generously borrowed from and/or hugely inspired by Andrew Reid's
      excellent Marker Clustering example (https://bl.ocks.org/Andrew-Reid/21ff4b57267fa91dacc57ef1ccb7afb3)
      and his d3-fuse library (https://github.com/Andrew-Reid/d3-fuse).
      For every point in our data, visit each node in the quadtree and check if the point lies
      within or within one radius distance of the quadrat. If this is not the case, that node's
      child nodes will not be visited. (https://github.com/d3/d3-3.x-api-reference/blob/master/Quadtree-Geom.md#visit)
    */
      
    let oldLen = 0;

    while (true) {
      for (let i in points) {
        p1 = points[i]
        // visit each node in the quadtree
        qtree.visit(function(quad, x0, y0, x1, y1) {

          let p2 = quad.point,
              r  = p1.r + quad.r;
          
          if (p2) {
            if (p2.index != p1.index && p1.a && p2.a) {
              let x = p2.x - p1.x,
                  y = p2.y - p1.y,
                  l = Math.sqrt(x * x + y * y),
                  a, b;

              // check for circle-circle intersection
              // https://www.youtube.com/watch?v=hYDRUES1DSM
              if (l < (p1.r + p2.r)) {

                // figure out which circle is the bigger one (by area)
                if (p2.a > p1.a) {a = p2, b = p1}
                else {            a = p1, b = p2}

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
          /* Check if circle lies outside of the quad's bounding box.
            If this returns true, child nodes of the quad are not going to be visited.
            The combined radius r is used as a buffer, since a point can lie near or
            on the boundary of a quadrat.
          */
          return x0 > p1.x + r || x1 < p1.x - r || y0 > p1.y + r || y1 < p1.y - r
        })
      }

      points = points.filter(d => d.r != 0)  // remove absorbed circles from array
      if (points.length == oldLen) break  // stop while loop if number of points didn't change
      oldLen = points.length  // save number of points for next iteration
    }

    vector.selectAll('circle').remove()
    // add circles to the map
    let circs = vector.selectAll('circle')
      .data(points)
      .enter()
        .append('circle')
          .attr('class', 'circClass')
          .attr({
            r : d => d.r,
            cx: d => d.x || -1e9, // off the viewport if its on the
            cy: d => d.y || -1e9, // far side of the globe
            fill: 'aqua',
            stroke: 'teal',
          })
          .style('opacity', 0.9);
  }
}
