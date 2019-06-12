let map = (function(){

    d3.json('geo/footprint.centroids.geo.json', init)

    // create configuration template object that holds the settings' default values
    let config_template  = {
            height : 400,
             width : 800,
            div_id : 'map',        // id of the div container holding the chart
        projection : 'mercator',
              tile : 'dark',
             color : 'aqua',
            stroke : 'teal',
            margin : {    top : 50,
                        right : 50,
                       bottom : 50,
                         left : 50 },
              data : {},
    };

    let config_array = [],
        stacked = [];

    // push one copy of the template to the array for every time you want to call
    // draw_map on the page
    config_array.push(jQuery.extend(true, {}, config_template))
    // config_array.push(jQuery.extend(true, {}, config_template))
    // config_array.push(jQuery.extend(true, {}, config_template))

    function init(error, data) {

        if (error) throw error;

        // add data and specify configuration for each chart
        config_array[0].div_id     = 'map1'
        config_array[0].data       = data
        config_array[0].projection = 'mercator'
        config_array[0].opacity    = 0.7
        config_array[0].tile       = 'light'
        config_array[0].stroke     = 'black'
        config_array[0].color      = 'red'

        // config_array[1].div_id     = 'map2'
        // config_array[1].projection = 'mercator'
        // config_array[1].data       = data
        // config_array[1].tile       = 'light'
        // config_array[1].color      = '#8BC34A'
        // config_array[1].stroke     = 'green'
        // config_array[1].opacity    = 0.7

        // config_array[2].div_id     = 'map3'
        // config_array[2].projection = 'mercator'
        // config_array[2].data       = data
        // config_array[2].tile       = 'wiki'
        // config_array[2].color      = 'red'
        // config_array[2].stroke     = 'black'
        // config_array[2].opacity    = 0.5

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
