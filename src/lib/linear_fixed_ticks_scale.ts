import { scaleLinear, ScaleLinear } from "d3";

export interface ScaleLinearFixedTicks extends ScaleLinear<number, number> {
    niceValues(values: number[]) : this
    niceValues() : number[]
}
function scaleLinearFixedTicksImplementation(linear_scale_in: ScaleLinear<number, number>, nice_values: number[]) : ScaleLinearFixedTicks {
    let linear_scale = linear_scale_in as ScaleLinearFixedTicks 
    const original_copy = linear_scale.copy

    linear_scale.copy = () => {
        let ret = original_copy()
        let niceValues = [...linear_scale.niceValues()]
        return scaleLinearFixedTicksImplementation(ret, niceValues)
    } 

    linear_scale.ticks = (count?: number): number[] => {
        if (count == undefined) {
            count = 10
        }
        const domain = linear_scale.domain()
        const range = domain[1] - domain[0]
        const preliminary_step = range / (count -1 )
        let step_scale = 10**Math.ceil(Math.log10(preliminary_step))

        let step = (preliminary_step) / step_scale
        let i=0
        for (;i<nice_values.length;++i) {
            if (step <= nice_values[i]) {
                step = nice_values[i]
                break
            }
        }
        if (i==nice_values.length) {
            step = 1.0;
        }
        step*= step_scale
        let start = Math.floor(domain[0] / step)*step
        let end = start + step*(count-1)
        while (end < domain[1]) {
            i++
            if (i==nice_values.length) {
                step = step_scale
            }
            else if(i>nice_values.length) {
                step_scale*=10
                if (nice_values[0]==0.1) {
                    i=1
                }
                else {
                    i=0
                }
                step = nice_values[i] * step_scale
            }
            else {
                step = nice_values[i] * step_scale
            }
            start = Math.floor(domain[0] / step)*step
            end = start + step*(count-1)
        }
        linear_scale.domain([start, end])

        return Array.from({length: count}, (_, i: number) => {return start + i*step})
    }
    linear_scale.niceValues = (values?: number[]): any => {
        if (values == undefined) {
            return nice_values
        }
        else {
            nice_values = values
            return  linear_scale
        }
    }
    return linear_scale
}

export function scaleLinearFixedTicks() : ScaleLinearFixedTicks {
    let linear_scale = scaleLinear()
    let nice_values: number[] = [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8]
    return scaleLinearFixedTicksImplementation(linear_scale, nice_values)
}