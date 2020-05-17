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

export function get_min_max(array: ArrayLike<number>, start: number, end: number) {
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