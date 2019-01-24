let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let config = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
            div_id : '#leftDiv',
          chart_id : '#leftChart',
            margin : {    top : 40,
                        right : 40,
                       bottom : 40,
                         left : 40 },
              data : [],
    }

    function init(json) {
        config.data = json.data;
        redraw();
    }

    function redraw() {
        console.log('config', config)
        pie_chart = draw_pie(config);
    }

    return {
        render : redraw
    }

})();

let resize_windows = function(){
    window.dispatchEvent(new Event('resize'));
}
window.addEventListener('resize', pie_area.render);

