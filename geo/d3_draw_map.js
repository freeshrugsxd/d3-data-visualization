/* We use online map tiles as a background map. This means less computing on the
  client side and therefore faster loading times and reduced lag on slower or older
  machines. 

  Tiles are image files that are indexed by their x/y-offset and the zoom
  level at which they are shown. These parameters are passed via URL.
*/

function draw_map(config) {
  const divId      = config.div_id,
      mapId      = `map_${divId}`,
      divIdSel   = `#${divId}`,
      circClass  = `${mapId}_circle`,
      circClassSel = `.${circClass}`,
      ttipClass   = `tooltip_${mapId}`,    // class name for tooltip div element
      ttipClassSel   = `.${ttipClass}`,    // selector for tooltip div element
      
      width      = config.width || $(divIdSel).width(),
      opacity    = config.opacity || 1,
      height     = config.height,
      my_tile    = config.tile,
      circCol    = config.color,
      circStroke = config.stroke,

      pi = Math.PI;

  let scale = 0;

  $(divIdSel).html('')
  $(ttipClassSel).remove()  // remove all leftover tooltips on redraw

  // projection library:
  const projections = {
      mercator : d3.geo.mercator(),
      equirect : d3.geo.equirectangular(),
  };

   
  // define tooltip (coords are declared later on mouse events)
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', ttipClass)
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

  // http://bl.ocks.org/jasondavies/0051a06829e72b423ba9
  // determine x index of wrapped tiles east and west of the original map
  const wrapX = d => (d[0] % (1 << d[2]) + (1 << d[2])) % (1 << d[2]);

  const tile_urls = {
    // https://wiki.openstreetmap.org/wiki/Tiles
    dark : d => `https://cartodb-basemaps-${Math.floor(Math.random() * 4 + 1)}.global.ssl.fastly.net/dark_all/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    light: d => `https://cartodb-basemaps-${Math.floor(Math.random() * 4 + 1)}.global.ssl.fastly.net/light_all/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    ocean: d => `https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/${d[2]}/${d[1]}/${wrapX(d)}.png`,
    wiki : d => `https://maps.wikimedia.org/osm-intl/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    bw   : d => `https://tiles.wmflabs.org/bw-mapnik/${d[2]}/${wrapX(d)}/${d[1]}.png`,
    meeks: d => `http://a.tiles.mapbox.com/v3/elijahmeeks.map-zm593ocx/${d[2]}/${wrapX(d)}/${d[1]}.png`
  };

  // convenience function to project any data to the specified projection
  // mercator scale: https://www.wikiwand.com/en/Mercator_projection#/Alternative_expressions
  let proj = projections[config.projection]
      .scale(width / 2 / pi)
      .translate([width / 2, height / 2])

  let center = proj([0, 15])  // center map on North Africa/Europe

  // initiate tiles
  // overflow method thanks to Jason Davies (http://bl.ocks.org/jasondavies/0051a06829e72b423ba9)
  let tile = d3.geo.tile()
      .size([width, height])
      .overflow([true, false]);

  // initiate zoom and center map
  let zoom = d3.behavior.zoom()
      .scale(proj.scale() * 2 * pi)
      .scaleExtent([width, 1 << 16])
      .translate([width - center[0], height - center[1]])
      .on('zoom', zoomed);

  // recenter projection after zoom is configured to make it work correctly when
  // scaling and translating our circles
  proj.translate([0, 0])

  let svg = d3.select(divIdSel)
      .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)  
      //.attr({ width: width, height: height, class: mapId})
        .call(zoom);

  let raster = svg.append('g'),  // group for tile images
      vector = svg.append('g');  // group for circles

  let scaleRad = d3.scale.sqrt()
      .domain([1, 2e6])
      .range([1, 60])
  
  // convenience function to calculate the quadtree
  let quadtree = d3.geom.quadtree()
      .x(d => d.x)
      .y(d => d.y)

  zoomed()

  function update(config) {
    // on every update: calculate the clustered markers and draw them as circles onto the map

    let data = config.data.features,
      points = Array(data.length);

    // populate points array with our data
    data.map( function(d, i) {
      points[i] = {}
      points[i].index = i
      points[i].count = d.properties.num_products
      
      points[i].r = scaleRad(d.properties.num_products) * (1 + (scale >> 10) / 10)  // assign scaled radius

      // project lat / lon data to x,y values in our projection
      points[i].x = proj(d.geometry.coordinates)[0]
      points[i].y = proj(d.geometry.coordinates)[1]
      
      points[i].a = pi * (points[i].r * points[i].r)  // calculate the area of the circle
    })
    
    /* The following algorithm is used to find and assign the maximum circle radii for 
      every node in the quadtree. Only leaf nodes have a point object attached, 
      which holds the radius for the corresponding point. Our goal is to find the 
      maximum radius of all circles inside a node and all of its child nodes.
      To do this, we first store all the nodes in an array and then start to work our
      way through the nodes in Post-Order (https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/)
      and hand the radius of the leaf nodes upwards to their parent nodes. Since the array
      consists of references to the original objects inside the node, all modifications
      made to them will be present in the original node. (variable: qtree)
    */ 

    qtree = quadtree(points)  // calculate quadtree

    let next = [];
    // traverse the quadtree in Pre-Order and push all nodes into an array
    qtree.visit(function(quad) {
      next.push(quad)
    })

    /* Since d3v3 does not have a visitAfter()-method, like more recent versions do,
      (https://github.com/d3/d3-quadtree/blob/master/src/visitAfter.js) which traverses 
      the quadtree in post-order, we have to implement one ourselves. I am basically just
      taking the last element of the array, while there still is one, and check if it is
      a leaf node. If so, take the point's radius and assign it to its parent node.
      If it's not a leaf node, check it for child nodes, take the biggest of their radii 
      and assign it to the current node. Every node can only have up to four (4) child 
      nodes (topleft, topright, bottomleft, bottomright).
    */

    // take last item of the array and check if its a leaf
    while (quad = next.pop()) {
      if (quad.point) {
        // assign radius attribute to node and continue with next iteration
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
                  a, b;

              // check for circle-circle intersection
              // https://www.youtube.com/watch?v=hYDRUES1DSM
              if (Math.sqrt(x * x + y * y) < (p1.r + p2.r)) {

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

    vector.selectAll(circClassSel).remove()
    
    // add circles to the map
    let circs = vector.selectAll(circClassSel)
      .data(points)
      .enter()
        .append('circle')
          .attr('class', circClass)
          .attr({
            r : d => d.r ,
            cx: d => d.x,
            cy: d => d.y,
            fill: circCol,
            stroke: circStroke,
            opacity : opacity
          })
    circs.on('mousemove', function(d) {
      tooltip.html(d.count > 1000 ? `${parseInt(d.count / 1000)}k` : d.count)
      .style('top',  `${d3.event.pageY + 15}px`)
      .style('left', `${d3.event.pageX + 10}px`)
      .style('pointer-events', 'none')
      .style('visibility', 'visible')
    })
    .on('mouseout', function(d) {
        // hide tooltip and remove its content
        tooltip.html('').style('visibility', 'hidden');
    })
  }

  function zoomed() {
    // On zoom: move and scale background tiles and circles appropriately
    let t = zoom.translate(),
        s = zoom.scale();

    let tiles = tile.scale(s).translate(t)()

    proj.scale(s / 2 / pi)

    vector.attr('transform', `translate(${t[0]} , ${t[1]})`)
    vector.selectAll('circle')
        .attr('r', d => d.r)

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

    if (scale != s) {
      scale = s
      update(config)
    }
  }
}
