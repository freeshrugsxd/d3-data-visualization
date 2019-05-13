let map = (function(){

    let q = d3.queue();
    /* 
        the queue library is used to read the contents of multiple files concurrently 
        instead of asynchronously. This is preferable over the alternative of having n
        nested d3.json calls. The content of all deferred files will be read and then 
        passed to the callback specified by the await() function.
        see: https://github.com/d3/d3-queue        
        code: libs/d3-queue.v3.min.js
    */    
    jsonFiles = [
        'geo/point.data.json',              // point data set containing random values
        'geo/cities.json',                  // capitals and world cities
        'geo/world.boundaries.min.json',    // world country borders geoJSON
        'geo/provs.min.topo.json'           // world province borders topoJSON
    ]

    for (let i in jsonFiles) q.defer(d3.json, jsonFiles[i])

    q.await(init)  // pass all json files to init

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
          features : {},
    };

    let config_array = [],
        stacked = [];

    // push one copy of the template to the array for every time you want to call
    // draw_map on the page
    config_array.push(jQuery.extend(true, {}, config_template))
    // config_array.push(jQuery.extend(true, {}, config_template))
    // config_array.push(jQuery.extend(true, {}, config_template))

    function init(error, data, cities, countries, provinces) {
        /*  Process the contents of all json files. 
            The data parameter is a point feature collection containing ~4.6k points with
            a random value attached (integer between 1 and 10). 
            Next to the point data, there are two data sets that depict administrative
            boundaries of the earth, one for every country and one for provinces. 
        */
        if (error) throw error;

        // convert the topoJSON Topology to geoJSON FeatureCollection and grab its features
        provinces = topojson.feature(provinces, provinces.objects.provs)

        // add data and specify configuration for each chart
        config_array[0].div_class  = 'map1'
        config_array[0].data       = data.features
        config_array[0].features.countries = countries.features
        config_array[0].features.provinces = provinces.features
        config_array[0].features.cities    = cities.features
        config_array[0].projection = 'equirect'
        config_array[0].graticule  = true
/* 
        config_array[1].div_class  = 'map3'
        config_array[1].projection = 'mercator'
        config_array[1].data       = data.features
        config_array[1].features.countries = countries.features
        config_array[1].features.provinces = provinces.features
        config_array[1].features.cities    = cities.features */
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
