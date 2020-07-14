import React, {FunctionComponent, useState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme, Slider } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';
import {stub} from "sinon"
import {act} from "react-dom/test-utils"
import { assertThat, closeTo, anyOf, falsy } from "hamjest"


describe("<TimeSlider/>", () => {
    const tolerance = 1e-12
    const mouse_left = 10
    const closeToTolerance = (value: number) => {
        return closeTo(value, tolerance)
    }

    let mount: ReturnType<typeof createMount>

    beforeAll(() => {
        mount = createMount()
    })

    afterAll(() => {
        mount.cleanUp()
    })

    const createSlider=(args: {value: number, step: number, num_steps: number, min: number, max: number, num_pixels: number}) => {
        const {value, step, num_steps, min, max, num_pixels} = args
        const theme = createMuiTheme()

        interface Props {
            value: number
            min: number
            max: number
            step: number
            num_steps: number
        }

        const Wrapper: FunctionComponent<Props> = (props) => {
            const [value, setValue] = useState(props.value)
            const onChange = (time: number) => {
                setValue(time)
            }

            return (
                <ThemeProvider theme={theme}>
                    <TimeSlider
                        value={value}
                        step={props.step}
                        max_steps={props.num_steps}
                        min={props.min}
                        max={props.max}
                        onChange={onChange}
                    />
                </ThemeProvider>
            )
        }

        const wrapper = mount(
                <Wrapper
                    value={value}
                    step={step}
                    num_steps={num_steps}
                    min={min}
                    max={max}
                />
        )
        const slider = wrapper.find(Slider)
        stub(slider.getDOMNode(), "getBoundingClientRect").callsFake(() => {
            const height = 5
            const left = mouse_left
            const top = 0
            return {
                x: left,
                y: top,
                width: num_pixels,
                height: height,
                left: left,
                right: left + num_pixels,
                top: top,
                bottom: top + num_pixels,
                toJSON: () => {}
            } 
        })
        
        return wrapper
    }

    let wrapper: ReturnType<typeof createSlider>

    const getThumb = () => {
        return wrapper.find('[role="slider"]')
    }

    const getValue = () => {
        return wrapper.find(TimeSlider).prop("value")
    }

    const getMin = () => {
        return getThumb().prop("aria-valuemin")
    }
    
    const getMax = () => {
        return getThumb().prop("aria-valuemax")
    }

    const simulateEvent = (eventName: string, ...args: any[]) => {
        const event = new window["MouseEvent"](eventName, ...args);
        act(() => {document.dispatchEvent(event)})
        wrapper.update()
    }

    const pressRight = () => {
        getThumb().simulate("keyDown", {key: "ArrowRight"})
    }

    const pressLeft = () => {
        getThumb().simulate("keyDown", {key: "ArrowLeft"})
    }

    const pressHome = () => {
        getThumb().simulate("keyDown", {key: "Home"})
    }

    const pressEnd = () => {
        getThumb().simulate("keyDown", {key: "End"})
    }

    const mouseDown = (x: number) => {
        getThumb().simulate("mousedown", {clientX: x,  clientY: 0})
    }

    const mouseUp = (x: number) => {
        simulateEvent("mouseup", {clientX: x, clientY: 0})
    }

    const mouseMove = (x: number) => {
        simulateEvent("mousemove", {clientX: x, clientY: 0})
    }

    const tests = [
    //  value   |min    |max    |step   |steps  |pixels |m.steps|e.min  |e.max
        ["exact pixel to step ratio",
        500,    0,      1000,   1,      1000,   1000,   1,      0,      1000],
        ["min and max not divisible by steps",
        3.6,    -2.5,   7.35,   0.2,    100,    1000,   1,      -2.5,   7.35],
        ["value not divisible by steps",
        4.35,   -1.1,   6,      0.2,    100,    1000,   1,      -1.1,   6],
        ["does not reach min and max",
        4.35,   -1.1,   10,      0.2,    20,    1000,   1,      2.35,   6.35],
        ["does not reach max",
        4.35,   2.55,   10,      0.2,    20,    1000,   1,      2.55,   6.55],
        ["does not reach min",
        5,      0,      6,       0.2,    20,    1000,   1,      2,      6],
        ["less pixels than steps",
        500,    0,      1000,   1,      1000,   700,    2,      0,      1000],
        ["even less pixels than steps",
        500,    0,      1000,   1,      1000,   300,    4,      0,      1000],
        ["value not divisible by mouse multiplier",
        501,    0,      1000,   1,      1000,   300,    4,      0,      1000],
    ]
    describe.each(tests)("when %s (value: %d, min: %d, max: %d, step: %d, num_steps: %d, num_pixels: %d)",
        (description: string, value: number, min: number, max: number, step: number, num_steps: number, num_pixels: number, mouse_steps: number,
             exp_min: number, exp_max: number) => {

        let mouse_step: number
        beforeEach(() => {
            wrapper = createSlider({value, step, num_steps, min, max, num_pixels})
            mouse_step = mouse_steps*step
        })
        const ratio_to_pixel = (ratio: number) => {
            return mouse_left + Math.round(num_pixels*ratio)
        }

        const value_to_pixel = (value: number) => {
            const range = exp_max - exp_min
            const relative_value = value - exp_min
            return ratio_to_pixel(relative_value / range)
        }

        const ratio_to_value = (ratio: number) => {
            const range = exp_max - exp_min
            return exp_min + range*ratio
        }

        it("sets the initial value corectly", () => {
            assertThat(getValue(), closeToTolerance(value))
        })
        it("increments when moving forward", () => {
            pressRight()
            assertThat(getValue(), closeToTolerance(value+step))
        })
        it("decrements when moving backward", () => {
            pressLeft()
            assertThat(getValue(), closeToTolerance(value-step))
        })
        it("returns to the same value when moving forward and back", () => {
            pressRight()
            pressLeft()
            assertThat(getValue(), closeToTolerance(value))
        })
        it("moves to the end when pressing end", () => {
            pressEnd()
            assertThat(getValue(), closeToTolerance(exp_max))
        })
        it("moves to the start when pressing home", () => {
            pressHome()
            assertThat(getValue(), closeToTolerance(exp_min))
        })
        it("does not change value when clicking in the value position", () => {
            mouseDown(value_to_pixel(value))
            assertThat(getValue(), closeTo(value, tolerance))
            mouseUp(value_to_pixel(value))
            assertThat(getValue(), closeTo(value, tolerance))
        })
        it("changes value when clicking", () => {
            // Note we allow the value to vary by one extra mouse step
            mouseDown(ratio_to_pixel(0.37))
            assertThat(getValue(), closeTo(ratio_to_value(0.37), mouse_step*2+tolerance))
            mouseUp(ratio_to_pixel(0.37))
            assertThat(getValue(), closeTo(ratio_to_value(0.37), mouse_step*2+tolerance))
        })
        it("changes value when clicking another position", () => {
            // Note we allow the value to vary by one extra mouse step
            mouseDown(ratio_to_pixel(0.79))
            assertThat(getValue(), closeTo(ratio_to_value(0.79), mouse_step*2+tolerance))
            mouseUp(ratio_to_pixel(0.79))
            assertThat(getValue(), closeTo(ratio_to_value(0.79), mouse_step*2+tolerance))
        })
        it("can drag mouse through all values with mouse steps", () => {
            const tolerance = 1e-12
            const start_pixel = value_to_pixel(value)
            let current_value = value
            mouseDown(start_pixel)
            assertThat(getValue(), closeToTolerance(value))
            // Drag backwards towards min
            for(let i=start_pixel;i>=0;--i) {
                mouseMove(i)
                const new_value = getValue()
                const prev_step_value = Math.max(current_value - mouse_step, exp_min)
                assertThat(new_value, 
                    anyOf(
                        closeTo(current_value, tolerance),
                        closeTo(prev_step_value, tolerance)
                ))
                if (Math.abs(new_value - prev_step_value)<=tolerance) {
                    current_value = new_value
                }
            }
            assertThat(getValue(), closeTo(exp_min, tolerance))
            mouseMove(start_pixel)
            current_value = getValue()
            assertThat(current_value, closeTo(value, tolerance))
            // Drag slightly past the end to make sure that the last value is included
            for(let i=start_pixel;i<num_pixels+10;++i) {
                mouseMove(i)
                const new_value = getValue()
                const next_step_value = Math.min(current_value + mouse_step, max)
                assertThat(new_value, 
                    anyOf(
                        closeTo(current_value, tolerance),
                        closeTo(next_step_value, tolerance)
                ))
                if (Math.abs(new_value - next_step_value)<=tolerance) {
                    current_value = new_value
                }
            }
            mouseUp(start_pixel)
            assertThat(getValue(), closeTo(value, tolerance))
        })
    })
})