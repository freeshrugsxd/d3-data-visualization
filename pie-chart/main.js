let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let config_template  = {
        max_radius : 300,
        min_radius : 50,
             inner : 'children',
       containerId : 'pie-chart',
       max_txt_len : null,
            legend : true,
      fancy_legend : true,
          headline : false,
            labels : false,
             color : 'cat10',
            margin : {    top : 50,
                        right : 50,
                       bottom : 50,
                         left : 50 },
              data : [],
    };

    let config_array = [],
        stacked = [];

    config_array.push( jQuery.extend(true, {}, config_template) );
    config_array.push( jQuery.extend(true, {}, config_template) );
    config_array.push( jQuery.extend(true, {}, config_template) );

    function init(json) {
        config_array[0].data         = json.n_prod
        config_array[0].containerId  = 'drill-down-pie-chart-1'
        config_array[0].legend       = true
        config_array[0].fancy_legend = true
        config_array[0].headline     = true
        config_array[0].max_txt_len  = 10
        config_array[0].color        = 'cat20'

        config_array[1].data         = json.my_test_data
        config_array[1].containerId  = 'drill-down-pie-chart-2'
        config_array[1].headline     = true
        config_array[1].labels       = true
        config_array[1].legend       = false
        config_array[1].color        = 'pink'

        config_array[2].data         = json.n_prod
        config_array[2].containerId  = 'drill-down-pie-chart-3'
        config_array[2].fancy_legend = false
        config_array[2].color        = 'green'
        redraw()
    }

    function redraw() {
        for (k = 0; k < config_array.length; k++){
            stacked[k] = draw_pie(config_array[k])
        }
    }

    return { render : redraw }

})()


let resize_windows = function(){ window.dispatchEvent(new Event('resize'))}
window.addEventListener('resize', pie_area.render)
