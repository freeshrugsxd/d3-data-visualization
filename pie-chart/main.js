let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init) // read data set and pass it to callback

    // create configuration template object that holds the settings' default values
    let config_template  = {
        max_radius : 300,          // pie chart's maximum outer radius
        min_radius : 50,           // pie chart's minimum outer radius
             inner : 'children',   // name of data set's child nodes
         div_class : 'pie-chart',  // class of the div container holding the chart
       max_txt_len : 15,           // max allowed legend entry text before truncation
          headline : false,        // shows the name of current level above the chart
            labels : false,        // shows name of child nodes inside the pie slices
            legend : false,        // display a legend next to the pie chart
      fancy_legend : false,        // play transitions on the legend
             color : 'cat10',      // name of the color range
            margin : {    top : 50,
                        right : 50,
                       bottom : 50,
                         left : 50 },
              data : [],
    };

    let config_array = [],
        stacked = [];

    config_array.push(jQuery.extend(true, {}, config_template))  // one copy for each
    config_array.push(jQuery.extend(true, {}, config_template))  // chart that is to
    config_array.push(jQuery.extend(true, {}, config_template))  // be displayed
    config_array.push(jQuery.extend(true, {}, config_template))

    function init(json) {
        // add data and specify configuration for each chart
        config_array[0].data         = json.n_prod
        config_array[0].div_class    = 'drill-down-pie-chart-1'
        config_array[0].headline     = true
        config_array[0].legend       = true
        config_array[0].fancy_legend = true
        config_array[0].max_txt_len  = 13
        config_array[0].color        = 'cat20'

        config_array[1].data         = json.my_test_data
        config_array[1].div_class    = 'drill-down-pie-chart-2'
        config_array[1].headline     = true
        config_array[1].labels       = true
        config_array[1].color        = 'pink'
        config_array[1].label_size   = 14

        config_array[2].data         = json.my_test_data
        config_array[2].div_class    = 'drill-down-pie-chart-3'
        config_array[2].labels       = true
        config_array[2].legend       = true
        config_array[2].color        = 'cat10'

        config_array[3].data         = json.n_prod
        config_array[3].div_class    = 'drill-down-pie-chart-4'
        config_array[3].headline     = true,
        config_array[3].labels       = true,
        config_array[3].legend       = true,
        config_array[3].fancy_legend = true,
        config_array[3].label_size   = 13,
        config_array[3].color        = 'nature'

        redraw()
    }

    function redraw() {
        // call draw function for each chart configuration
        for (k = 0; k < config_array.length; k++){
            stacked[k] = draw_pie(config_array[k])
        }
    }

    return { render : redraw }

})()


let resize_windows = function(){ window.dispatchEvent(new Event('resize'))}
window.addEventListener('resize', pie_area.render)
