let pie_area = (function(){
    d3.json('pie-chart/pie_data.json', init)

    let configs  = {},
        template = {
         ref_width : 350,
        ref_height : 350,
         min_width : 200,
        min_height : 200,
            div_id : '#leftDiv',
          chart_id : '#leftChart',
            margin : {    top : 35,
                        right : 35,
                       bottom : 35,
                         left : 35 },
              data : [],
    };

    configs.left  = template;
    configs.right = Object.assign({}, configs.left);
    jQuery.extend(configs.right, { div_id : '#rightDiv', chart_id : '#rightChart' });

    function init(json) {
        configs.left.data = json.data;
        redraw()
    }

    function redraw() {
        left_chart = draw_pie(configs, 'l')
        right_chart = draw_pie(configs, 'r')
    }

    return { render : redraw }

})()


let resize_windows = function(){
    window.dispatchEvent(new Event('resize'))
}
window.addEventListener('resize', pie_area.render)
