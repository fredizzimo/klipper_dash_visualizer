import { scaleLinearFixedTicks } from "./linear_fixed_ticks_scale"
import { assertThat, equalTo } from "hamjest"

describe("linearFixedTicksScale", () => {
    it("initializes the default nice values", () => {
        const niceValues = scaleLinearFixedTicks().niceValues()
        assertThat(niceValues, equalTo([0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8]))
    })
    it("is possible to set the nice values", () => {
        const niceValues = scaleLinearFixedTicks().niceValues([0.3, 0.5]).niceValues()
        assertThat(niceValues, equalTo([0.3, 0.5]))
    })
    it("returns 10 ticks by default", () => {
        const ticks = scaleLinearFixedTicks().domain([1, 10]).ticks()
        assertThat(ticks.length, equalTo(10))
        assertThat(ticks, equalTo([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
    })
    it("returns the desired number of ticks", () => {
        const ticks = scaleLinearFixedTicks().domain([1, 3]).ticks(3)
        assertThat(ticks.length, equalTo(3))
        assertThat(ticks, equalTo([1, 2, 3]))
    })

})