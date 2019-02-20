let pie_area = (function(){
    // d3.json('pie-chart/pie_data.json', init)
    d3.json('pie-chart/hystorical_sunchart.json', init)

    let config  = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
            legend : true,
             inner : 'children',
       containerId : 'pie-chart',
           heading : '',
            margin : {    top : 75,
                        right : 75,
                       bottom : 75,
                         left : 75 },
              data : [],
    };

    function init(json) {
        // config.data = json.data;
        config.data = json.n_prod;
        config.containerId = 'drill-down-pie-chart'
        redraw()
    }

    function redraw() {
        left_chart = draw_pie(config)
    }

    return { render : redraw }

})()


const resize_windows = function(){ window.dispatchEvent(new Event('resize'))}
window.addEventListener('resize', pie_area.render)
