let pie_area = (function(){
    // d3.json('pie-chart/pie_data.json', init)
    d3.json('pie-chart/hystorical_sunchart.json', init)

    let config  = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
            div_id : '#chartDiv',
          chart_id : '#pieChart',
            margin : {    top : 100,
                        right : 100,
                       bottom : 100,
                         left : 100 },
              data : [],
    };

    function init(json) {
        // config.data = json.data;
        config.data = json.n_prod;
        redraw()
    }

    function redraw() {
        left_chart = draw_pie(config)
    }

    return { render : redraw }

})()


let resize_windows = function(){
    window.dispatchEvent(new Event('resize'))
}
window.addEventListener('resize', pie_area.render)
