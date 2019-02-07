let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let config  = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
            div_id : '#chartDiv',
          chart_id : '#pieChart',
            margin : {    top : 35,
                        right : 35,
                       bottom : 35,
                         left : 35 },
              data : [],
    };

    function init(json) {
        config.data = json.data;
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
