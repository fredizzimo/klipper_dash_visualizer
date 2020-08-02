import { scaleLinearFixedTicks } from "./linear_fixed_ticks_scale"
import { assertThat, equalTo, closeTo, contains, not, lessThanOrEqualTo, greaterThanOrEqualTo } from "hamjest"
import * as ld from "lodash"

const almostEqTo = (value: number[]) => { 
    return ld.map(value, (value: number) => {return closeTo(value, 1e-12)})
}

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
    test("copy works correctly", () => {
        const scale1 = scaleLinearFixedTicks().domain([9, 17]).niceValues([0.1, 0.5])
        const scale2 = scale1.copy()
        assertThat(scale1, not(equalTo(scale2)))
        assertThat(scale2.domain(), equalTo(scale1.domain()))
        assertThat(scale2.niceValues(), equalTo(scale2.niceValues()))
        scale1.niceValues([0.1, 0.4])
        assertThat(scale2.niceValues(), equalTo([0.1, 0.5]))
    })
    it("returns the desired number of ticks", () => {
        const ticks = scaleLinearFixedTicks().domain([1, 3]).ticks(3)
        assertThat(ticks.length, equalTo(3))
        assertThat(ticks, equalTo([1, 2, 3]))
    })
    test("a 10 tick range with integer steps", () => {
        const ret = scaleLinearFixedTicks().domain([1, 10]).ticks(10)
        assertThat(ret, equalTo([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
    })
    test("a 3 tick range with integer steps", () => {
        const ret = scaleLinearFixedTicks().domain([1, 3]).ticks(3)
        assertThat(ret, equalTo([1, 2, 3]))
    })
    test("a range starting from 2", () => {
        const ret = scaleLinearFixedTicks().domain([2, 5]).ticks(4)
        assertThat(ret, equalTo([2, 3, 4, 5]))
    })
    test("an integer range starting from negative going to positive", () => {
        const ret = scaleLinearFixedTicks().domain([-2, 1]).ticks(4)
        assertThat(ret, equalTo([-2, -1, 0, 1]))
    })
    test("a negative integer range", () => {
        const ret = scaleLinearFixedTicks().domain([-6, -2]).ticks(5)
        assertThat(ret, equalTo([-6, -5, -4, -3, -2]))
    })
    test("divide 0 to 1 into five ticks should match exactly", () => {
        const ret = scaleLinearFixedTicks().domain([0, 1]).ticks(5)
        const expected = almostEqTo([0, 0.25, 0.5, 0.75, 1.0])
        assertThat(ret, contains(...expected))
    })
    test("divide 0 to 0.5 into 7 ticks should extend the range", () => {
        const ret = scaleLinearFixedTicks().domain([0, 0.5]).ticks(7)
        const expected = almostEqTo([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
        assertThat(ret, contains(...expected))
    })
    test("extended range also changes the domain", () => {
        const scale = scaleLinearFixedTicks()
        scale.domain([0, 0.5]).ticks(7)
        const expected = almostEqTo([0, 0.6])
        assertThat(scale.domain(), contains(...expected))
    })
    test("divide -0.5 to 0 into 7 ticks should extend the range", () => {
        const ret = scaleLinearFixedTicks().domain([-0.5, 0.0]).ticks(7)
        const expected = almostEqTo([-0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1])
        assertThat(ret, contains(...expected))
    })
    test("divide 0 to 100 into five ticks should match exactly", () => {
        const ret = scaleLinearFixedTicks().domain([0, 100]).ticks(5)
        const expected = almostEqTo([0, 25, 50, 75, 100])
        assertThat(ret, contains(...expected))
    })
    test("divide 20 to 110 into ten ticks should match exactly", () => {
        const ret = scaleLinearFixedTicks().domain([20, 110]).ticks(10)
        const expected = almostEqTo([20, 30, 40, 50, 60, 70, 80, 90, 100, 110])
        assertThat(ret, contains(...expected))
    })
    test("divide 30 to 110 into ten ticks should extend the upper range", () => {
        const ret = scaleLinearFixedTicks().domain([30, 110]).ticks(10)
        const expected = almostEqTo([30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
        assertThat(ret, contains(...expected))
    })
    test("divide 0.0 to 0.1 into 6 ticks should match exactly", () => {
        const ret = scaleLinearFixedTicks().domain([0, 0.1]).ticks(6)
        const expected = almostEqTo([0.0, 0.02, 0.04, 0.06, 0.08, 0.1])
        assertThat(ret, contains(...expected))
    })
    test("divide 10 to 100 into five ticks should shift the lower end", () => {
        const ret = scaleLinearFixedTicks().domain([10, 100]).ticks(5)
        const expected = almostEqTo([0, 25, 50, 75, 100])
        assertThat(ret, contains(...expected))
    })
    test("divide -90 to 0 into five ticks should shift the lower end", () => {
        const ret = scaleLinearFixedTicks().domain([-90, 0]).ticks(5)
        const expected = almostEqTo([-100, -75, -50, -25, 0])
        assertThat(ret, contains(...expected))
    })
    test("divide -40 to 50 into five ticks should shift the lower end", () => {
        const ret = scaleLinearFixedTicks().domain([-40, 50]).ticks(5)
        const expected = almostEqTo([-50, -25, 0, 25, 50])
        assertThat(ret, contains(...expected))
    })
    test("divide 10 to 110 into five ticks should shift the lower and increase the step", () => {
        const ret = scaleLinearFixedTicks().domain([10, 110]).ticks(5)
        const expected = almostEqTo([0, 30, 60, 90, 120])
        assertThat(ret, contains(...expected))
    })
    test("divide -110 to -10 into five ticks should shift the lower and increase the step", () => {
        const ret = scaleLinearFixedTicks().domain([-110, -10]).ticks(5)
        const expected = almostEqTo([-120, -90, -60, -30, 0])
        assertThat(ret, contains(...expected))
    })
    test("divide 1 to 3 into two ticks should shift and increase the step by two", () => {
        const ret = scaleLinearFixedTicks().domain([1, 3]).ticks(2)
        const expected = almostEqTo([0, 3])
        assertThat(ret, contains(...expected))
    })
    test("divide 1 to 9 into two ticks should shift and increase the step", () => {
        const ret = scaleLinearFixedTicks().domain([1, 9]).ticks(2)
        const expected = almostEqTo([0, 10])
        assertThat(ret, contains(...expected))
    })
    test("divide 1 to 11 into two ticks should shift and increase the step", () => {
        const ret = scaleLinearFixedTicks().domain([1, 11]).ticks(2)
        const expected = almostEqTo([0, 12])
        assertThat(ret, contains(...expected))
    })
    test("divide 1 to 11 into two ticks with nice values not starting from 0.1", () => {
        const ret = scaleLinearFixedTicks().domain([1, 11]).niceValues([0.2, 0.7, 0.9]).ticks(2)
        const expected = almostEqTo([0, 20])
        assertThat(ret, contains(...expected))
    })
    test("divide -10 to 116 into ten ticks should extend both ends", () => {
        const ret = scaleLinearFixedTicks().domain([-10, 116]).ticks(10)
        const expected = almostEqTo([-15, 0, 15, 30, 45, 60, 75, 90, 105, 120])
        assertThat(ret, contains(...expected))
    })
})