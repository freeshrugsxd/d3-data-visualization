let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let config_template  = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
             inner : 'children',
       containerId : 'pie-chart',
            legend : true,
   animated_legend : true,
          headline : false,
            labels : false,
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
        config_array[0].data = json.my_test_data
        config_array[0].containerId = 'drill-down-pie-chart-1'
        config_array[0].legend = false
        config_array[0].headline = true
        config_array[0].labels = true


        config_array[1].data = json.n_prod
        config_array[1].containerId = 'drill-down-pie-chart-2'
        config_array[1].headline = true
        config_array[1].animated_legend = false

        config_array[2].data = json.n_prod
        config_array[2].containerId = 'drill-down-pie-chart-3'

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
