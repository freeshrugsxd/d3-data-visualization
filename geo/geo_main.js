let map = (function(){
    d3.json('geo/world_boundaries.min.json', init) // read data set and pass it to callback

    // create configuration template object that holds the settings' default values
    let config_template  = {
            height : 600,
         div_class : 'map',        // class of the div container holding the chart
        projection : 'mercator',
              grid : false,
            margin : {    top : 50,
                        right : 50,
                       bottom : 50,
                         left : 50 },
          features : [],
    };

    let config_array = [],
        stacked = [];

    config_array.push(jQuery.extend(true, {}, config_template))
    config_array.push(jQuery.extend(true, {}, config_template))

    function init(json) {
        // add data and specify configuration for each chart
        config_array[0].div_class  = 'map1'
        config_array[0].features   = json.features
        config_array[0].projection = 'mercator'

        config_array[1].div_class  = 'map2'
        config_array[1].features   = json.features
        config_array[1].projection = 'globe'
        config_array[1].rotation   = [-4, -25]
        config_array[1].graticule  = true
        redraw()
    }

    function redraw() {
        // call draw function for each chart configuration
        for (k = 0; k < config_array.length; k++){
            stacked[k] = draw_map(config_array[k])
        }
    }

    return { render : redraw }

})()

let resize_windows = function(){
    window.dispatchEvent(new Event('resize'))
}

window.addEventListener('resize', map.render)
