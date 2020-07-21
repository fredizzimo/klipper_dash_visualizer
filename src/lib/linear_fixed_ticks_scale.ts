import { scaleLinear, ScaleLinear, range as d3_range } from "d3";

interface ScaleLinearFixedTicks extends ScaleLinear<number, number> {
    niceValues(values: number[]) : this
    niceValues() : number[]
}
export function scaleLinearFixedTicks() : ScaleLinearFixedTicks {
    let linear_scale = scaleLinear() as ScaleLinearFixedTicks
    let nice_values: number[] = [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8]
    const original_tick_function = linear_scale.ticks
    linear_scale.ticks = (count?: number): number[] => {
        if (count == undefined) {
            count = 10
        }
        const domain = linear_scale.domain()
        const range = domain[1] - domain[0]
        const step = range / (count - 1)
        return d3_range(domain[0], domain[1] + step/2, step)
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
    return linear_scale as ScaleLinearFixedTicks
}
