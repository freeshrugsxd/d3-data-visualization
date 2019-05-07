let map = (function(){

    let q = d3.queue();
        
    q.defer(d3.json, 'geo/point.data.min.json')
    q.defer(d3.json, 'geo/world_boundaries.min.json')
    q.defer(d3.json, 'geo/provs.topo.json')
    q.await(init)

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
    config_array.push(jQuery.extend(true, {}, config_template))

    let data = []

    function init(error, data, countries, provinces) {
        if (error) throw error;

        // json contains point features holding the values we want to display on the map
        // add data and specify configuration for each chart
        config_array[0].div_class  = 'map1'
        // config_array[0].height     = 300
        config_array[0].data       = data.features
        config_array[0].features   = {}
        config_array[0].features.countries = countries.features
        config_array[0].features.provinces = topojson.feature(provinces, provinces.objects.provs).features
        config_array[0].projection = 'equirect'
        config_array[0].graticule  = true

        // config_array[1].div_class  = 'map2'
        // config_array[1].features   = json.features
        // config_array[1].projection = 'globe'
        // config_array[1].rotation   = [-4, -25]
        // config_array[1].graticule  = true


        // config_array[2].div_class  = 'map3'
        // config_array[2].features   = json.features
        // config_array[2].projection = 'mercator'
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
