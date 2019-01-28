let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let template = {
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
    let config = {}
    config.left = template
    config.right = Object.assign({}, config.left)
    config.right.div_id = '#rightDiv'
    config.right.chart_id = '#rightChart'


    function init(json) {
        config.left.data = json.data;
        redraw();
    }

    function redraw() {
        left_chart = draw_pie(config, 'l');
        right_chart = draw_pie(config, 'r');
    }

    return {
        render : redraw
    }

})();

let resize_windows = function(){
    window.dispatchEvent(new Event('resize'));
}
window.addEventListener('resize', pie_area.render);
