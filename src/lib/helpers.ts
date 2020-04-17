export function range_start(array: ArrayLike<number>, value: number)
{
    var count = array.length;
    var first = 0;

    while (count > 0) {
        var elem = first; 
        var step = Math.floor(count / 2); 
        elem += step;
        if (array[elem] < value) {
            first = elem + 1;
            count -= step + 1; 
        }
        else { 
            count = step;
        }
    }
    if (first > 0)
    {
        first = first-1;
    }
    return first < array.length ? first : array.length-1;
}

export function range_end(array: ArrayLike<number>, value: number)
{
    var count = array.length
    var first = 0;

    while (count > 0) {
        var elem = first; 
        var step = Math.floor(count / 2); 
        elem += step;
        if (array[elem] <= value) {
            first = elem + 1;
            count -= step + 1; 
        }
        else { 
            count = step;
        }
    }
    return first < array.length ? first : array.length-1;
}

function get_min_max(array: ArrayLike<number>, start: number, end: number) {
    var min = array[0];
    var max = array[0] 
    for (let i=start;i<end;i++) {
        let v = array[i]
        if (v < min) {
            min = v;
        }
        else if(v > max) {
            max = v;
        }
    }
    return [min, max]
}

function zoom_trace_y(xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number)
{
    if (xvals.length == 0) {
        return [-100, 100];
    }
    var i_low = range_start(xvals, start);
    var i_high = range_end(xvals, end);
    var num_steps = xvals.length;
    if (i_low >= num_steps) {
        var range_low = yvals[yvals.length - 1];
        var range_high = range_low;
    } else if (i_low == i_high) {
        var range_low = yvals[i_low];
        var range_high = range_low;
    } else {
        let min_max = get_min_max(yvals, i_low, i_high+1);
        var range_low = min_max[0];
        var range_high = min_max[1]
    }
    var diff = range_high - range_low;
    var margin = diff * 0.1;
    range_high += margin;
    range_low -= margin;
    return [range_low, range_high];
}

export function zoom_figure_y(fig: any)
{
    var fig = {...fig}
    var x_range = fig.layout.xaxis.range
    for (let i=0;i<fig.data.length;i++) {
        let element = fig.data[i];
        let y_range = zoom_trace_y(element.x, element.y, x_range[0], x_range[1]);
        let axis_name = "yaxis"
        if (i > 0) {
            axis_name = axis_name + (i+1);
        }
        fig.layout[axis_name].range = y_range
        fig.layout[axis_name].autorange = false;
    }
    return fig
}