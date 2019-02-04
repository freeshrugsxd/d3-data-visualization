let configs  = {}
let ts_area = (function(){
    d3.csv('time-series/lux_waste.csv', init)

        template = {
         ref_width : 350,
        ref_height : 300,
         min_width : 200,
        min_height : 200,
            margin : {    top : 25,
                        right : 75,
                       bottom : 50,
                         left : 25 },
              data : [],
    };

    configs = template;

    function init(csv) {
        configs.data = csv[0];
        redraw()
    }

    function redraw() {
        ts = draw_ts(configs)
    }

    return { render : redraw }

})()


let resize_windows = function(){
    window.dispatchEvent(new Event('resize'))
}
window.addEventListener('resize', ts_area.render)
