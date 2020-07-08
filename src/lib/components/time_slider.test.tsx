import React, {FunctionComponent, ComponentProps, ComponentState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { Slider } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';
import {mount as EnzymeMount, ReactWrapper} from "enzyme"

describe("<TimeSlider/>", () => {
    const total_steps = 500

    const theme = createMuiTheme()
    let mount: typeof EnzymeMount

    const MockTheme: FunctionComponent = (props) => {
        return (
            <ThemeProvider theme={theme}>
                {props.children}
            </ThemeProvider>
        );
    }

    beforeAll(() => {
        mount = createMount()
    })

    describe("when initialized", () => {
        const onMinTimeChange = (time: Number) => {
        }

        const min=1
        const max = 99
        const value = 47

        let slider: ReactWrapper<ComponentProps<typeof Slider>>
        let thumb: ReactWrapper

        beforeAll(() => {
            let wrapper = mount(
                <MockTheme>
                    <TimeSlider
                        min={min}
                        max={max}
                        value={value}
                        onChange={onMinTimeChange}
                    />
                </MockTheme>
            );
            slider = wrapper.find(Slider)
            thumb = slider.find('[role="slider"]')
        })

        it("sets the initial internal value to zero", ()=> {
            expect(slider.prop("value")).toEqual(0)
        })
        it("sets the internal range to a fixed size", ()=> {
            expect(slider.prop("max") - slider.prop("min")).toEqual(total_steps)
        })
        it("sets the minimum internal range to negative", ()=> {
            expect(slider.prop("min")).toBeLessThan(0)
        })
        it("set the maximum internal range to positive", ()=> {
            expect(slider.prop("max")).toBeGreaterThan(0)
        })
        it("divides the internal range proportionally", ()=> {
            const ratio = (value - min) / (max - value)
            expect(-slider.prop("min") / slider.prop("max")).toBeCloseTo(ratio)
        })
        it("sets the value correctly", ()=> {
            expect(thumb.prop("aria-valuenow")).toBe(value)
        })
        it("sets the minimum correctly", ()=> {
            expect(thumb.prop("aria-valuemin")).toBe(min)
        })
        it("sets the maximum correctly", ()=> {
            expect(thumb.prop("aria-valuemax")).toBe(max)
        })
    })
})