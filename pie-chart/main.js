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
            margin : {    top : 25,
                        right : 25,
                       bottom : 25,
                         left : 25 },
              data : [],
    };

    configs.left  = template;
    configs.right = Object.assign({}, configs.left);
    jQuery.extend(configs.right, { div_id : '#rightDiv', chart_id : '#rightChart' });

    function init(json) {
        // console.log(json)
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
