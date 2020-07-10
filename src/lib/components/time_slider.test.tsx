import React, {FunctionComponent, ComponentProps, ComponentState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { Slider } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';
import {ReactWrapper} from "enzyme"

describe("<TimeSlider/>", () => {
    const total_steps = 501

    let mount: ReturnType<typeof createMount>

    beforeAll(() => {
        mount = createMount()
    })

    afterAll(() => {
        mount.cleanUp()
    })

    const createSlider=(min: number, max: number, value: number) => {
        const onChange = (time: Number) => {}
        const theme = createMuiTheme()
        const wrapper = mount(
            <ThemeProvider theme={theme}>
                <TimeSlider
                    min={min}
                    max={max}
                    value={value}
                    onChange={onChange}
                />
            </ThemeProvider>
        )
        const slider = wrapper.find(Slider)
        const thumb = slider.find('[role="slider"]')
        return {slider, thumb}
    }

    let slider: ReturnType<typeof createSlider>["slider"]
    let thumb: ReturnType<typeof createSlider>["thumb"]

    describe("when initialized with a symetric range", ()=> {
        const min=10
        const max =20 
        const value = 15

        beforeEach(() => {
            ({slider, thumb} = createSlider(min, max, value))
        })

        it("sets the internal value to zero", ()=> {
            expect(slider.prop("value")).toBeFloat(0)
        })
        it("has an internal range with the correct size", ()=> {
            expect(slider.prop("max") - slider.prop("min") + 1).toBeFloat(total_steps)
        })
        it("sets the internal min to negative half range", ()=> {
            expect(slider.prop("min")).toBeFloat(-250)
        })
        it("sets the internal max to positive half range", ()=> {
            expect(slider.prop("max")).toBeFloat(250)
        })
        it("sets the internal max to positive half range", ()=> {
            expect(slider.prop("max")).toBeFloat(250)
        })
        it("sets the value correctly", ()=> {
            expect(thumb.prop("aria-valuenow")).toBeFloat(value)
        })
        it("sets the minimum value correctly", ()=> {
            expect(thumb.prop("aria-valuemin")).toBeFloat(min)
        })
        it("sets the maximum value correctly", ()=> {
            expect(thumb.prop("aria-valuemax")).toBeFloat(max)
        })
    })

    describe("when initialized with an asymetric range", ()=> {
        const min=1
        const max = 99
        const value = 47
        const ratio = (value - min) / (max - value)

        beforeEach(() => {
            ({slider, thumb} = createSlider(min, max, value))
        })

        it("sets the internal value to zero", ()=> {
            expect(slider.prop("value")).toBeFloat(0)
        })
        it("has an internal range with the correct size", ()=> {
            expect(slider.prop("max") - slider.prop("min") + 1).toBeFloat(total_steps)
        })
        it("sets the internal min to a negative value", ()=> {
            expect(slider.prop("min")).toBeLessThan(0)
        })
        it("sets the internal max to positive value", ()=> {
            expect(slider.prop("max")).toBeGreaterThan(0)
        })
        it("has the correct range ratio", ()=> {
            expect(-slider.prop("min") / slider.prop("max")).toBeCloseTo(ratio)
        })
        it("sets the value correctly", ()=> {
            expect(thumb.prop("aria-valuenow")).toBeFloat(value)
        })
        it("sets the minimum value correctly", ()=> {
            expect(thumb.prop("aria-valuemin")).toBeFloat(min)
        })
        it("sets the maximum value correctly", ()=> {
            expect(thumb.prop("aria-valuemax")).toBeFloat(max)
        })
    })

    describe("when initialized with the same value as min", ()=> {
        const min=1
        const max = 99
        const value = 1

        beforeEach(() => {
            ({slider, thumb} = createSlider(min, max, value))
        })

        it("sets the internal value to zero", ()=> {
            expect(slider.prop("value")).toBeFloat(0)
        })
        it("has an internal range with the correct size", ()=> {
            expect(slider.prop("max") - slider.prop("min") + 1).toBeFloat(total_steps)
        })
        it("sets the internal min to zero", ()=> {
            expect(slider.prop("min")).toBeFloat(0)
        })
        it("sets the internal max to positive value", ()=> {
            expect(slider.prop("max")).toBeGreaterThan(0)
        })
        it("sets the value correctly", ()=> {
            expect(thumb.prop("aria-valuenow")).toBeFloat(value)
        })
        it("sets the minimum value correctly", ()=> {
            expect(thumb.prop("aria-valuemin")).toBeFloat(min)
        })
        it("sets the maximum value correctly", ()=> {
            expect(thumb.prop("aria-valuemax")).toBeFloat(max)
        })
    })

    describe("when initialized with the same value as max", ()=> {
        const min=1
        const max = 99
        const value = 99

        beforeEach(() => {
            ({slider, thumb} = createSlider(min, max, value))
        })

        it("sets the internal value to zero", ()=> {
            expect(slider.prop("value")).toBeFloat(0)
        })
        it("has an internal range with the correct size", ()=> {
            expect(slider.prop("max") - slider.prop("min") + 1).toBeFloat(total_steps)
        })
        it("sets the internal min to a negative value", ()=> {
            expect(slider.prop("min")).toBeLessThan(0)
        })
        it("sets the internal max to 0", ()=> {
            expect(slider.prop("max")).toBeFloat(0)
        })
        it("sets the value correctly", ()=> {
            expect(thumb.prop("aria-valuenow")).toBeFloat(value)
        })
        it("sets the minimum value correctly", ()=> {
            expect(thumb.prop("aria-valuemin")).toBeFloat(min)
        })
        it("sets the maximum value correctly", ()=> {
            expect(thumb.prop("aria-valuemax")).toBeFloat(max)
        })
    })
})