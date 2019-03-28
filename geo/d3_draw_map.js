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
    config.scale = 1;

  $(divClassSel).html('')

  let zoom = d3.behavior.zoom()
    .scaleExtent([1, 15])
    .on('zoom', panAndZoom)

  let svg = d3.select(divClassSel)
    .append('svg')
      .attr({ width: width, height: height })
      .call(zoom);

  let mainGrp = svg.append('g')

  const projections = {
    mercator : d3.geo.mercator().scale(width / 3 / Math.PI),
    equirect : d3.geo.equirectangular().scale(width /2 / Math.PI),
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

  config.features.map( function(d) {
    d.data = {}
    d.data.count = Math.random() / Math.random() + Math.random() + 25
  })

  function update(config) {

    nodes = config.features

    nodes.map( function(d, i) {
      // get centroids for every feature in the dataset
      xy = path.centroid(d)
      d.data.x = xy[0]
      d.data.y = xy[1]
      d.data.index = i
    })

    let quadtree = d3.geom.quadtree()
      .x(d => d.data.x)
      .y(d => d.data.y)

    qtree = quadtree(nodes)


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

    let clusterPoints = [],
        clusterRange  = parseInt(width / 20 / config.scale);

    for (let x = 0; x <= width; x += clusterRange) {
      for (let y = 0; y <= height; y+= clusterRange) {
        let searched  = search(qtree, x, y, x + clusterRange, y + clusterRange),
          centerPoint = searched.reduce( function(coll, curr) {
            return {x: coll.x + curr.x,
                    y: coll.y + curr.y,
               count : coll.count + curr.count}
          }, {x: 0, y: 0, count: 0});

        centerPoint.x = centerPoint.x / searched.length;
        centerPoint.y = centerPoint.y / searched.length;

        if (centerPoint != {x: 0, y: 0, count: 0}) {
          clusterPoints.push(centerPoint);
        }
      }
    }

    let max = Math.max(...clusterPoints.map(d => d.count))

    let radScale = d3.scale.sqrt()
      .domain([0, max])
      .range([1, (clusterRange / 2)])

    mainGrp.selectAll('circle').remove()
    // add circles on top of the map
    let circs = mainGrp.selectAll('circle')
      .data(clusterPoints)
      .enter()
        .append('circle')
          .attr('class', 'circClass')
          // set radius depending on your data (e.g. estimated population)
          .attr('r', d => radScale(d.count))
          .attr('stroke-width', `${1/Math.sqrt(config.scale)}px`)
          .attr('transform', function(d) {
            if (isNaN(d.x) || isNaN(d.y)) {
              return `translate(-9999, -9999)` // move these off the screen
            }
            else {
              return `translate(${d.x}, ${d.y})`
            }
          })
          .style({ fill: 'red', stroke: 'white', opacity: 0.67 });
  }

  function panAndZoom() {
    let t = d3.event.translate,
        s = d3.event.scale

    mainGrp.attr('transform', `translate(${t})scale(${s})`);
    bounds.style('stroke-width', `${1/Math.sqrt(s)}px`)

    if (s != config.scale) {
      config.scale = s
      update(config)
    }
  }

  // Find the nodes within the specified rectangle.
  function search(quadtree, x0, y0, x3, y3) {
    let validData = [];
    quadtree.visit(function(node, x1, y1, x2, y2) {
      let p = node.point;
      if (p) {
        p.selected = (p.data.x >= x0) && (p.data.x < x3) && (p.data.y >= y0) && (p.data.y < y3);
        if (p.selected) {
          validData.push(p.data);
        }
      }
      return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });
    return validData;
  }

  update(config)
}
