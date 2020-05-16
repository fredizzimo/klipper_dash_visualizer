export function rangeStart(array: ArrayLike<number>, value: number)
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

export function rangeEnd(array: ArrayLike<number>, value: number)
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

function getMinMax(array: ArrayLike<number>, start: number, end: number) {
    var min = array[0];
    var max = array[0] 
    for (var i=start;i<end;i++) {
        var v = array[i]
        if (v < min) {
            min = v;
        }
        else if(v > max) {
            max = v;
        }
    }
    return [min, max]
}

function zoomTraceY(xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number)
{
    if (xvals.length == 0) {
        return [-100, 100];
    }
    var i_low = rangeStart(xvals, start);
    var i_high = rangeEnd(xvals, end);
    var num_steps = xvals.length;
    if (i_low >= num_steps) {
        var range_low = yvals[yvals.length - 1];
        var range_high = range_low;
    } else if (i_low == i_high) {
        var range_low = yvals[i_low];
        var range_high = range_low;
    } else {
        var min_max = getMinMax(yvals, i_low, i_high+1);
        var range_low = min_max[0];
        var range_high = min_max[1]
    }
    var diff = range_high - range_low;
    var margin = diff * 0.1;
    range_high += margin;
    range_low -= margin;
    return [range_low, range_high];
}

export function zoomFigureY(fig: any)
{
    var fig = {...fig}
    var x_range = fig.layout.xaxis.range
    for (var i=0;i<fig.data.length;i++) {
        var element = fig.data[i];
        var y_range = zoomTraceY(element.x, element.y, x_range[0], x_range[1]);
        var axis_name = "yaxis"
        if (i > 0) {
            axis_name = axis_name + (i+1);
        }
        fig.layout[axis_name].range = y_range
        fig.layout[axis_name].autorange = false;
    }
    return fig
}