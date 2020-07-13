import React, {FunctionComponent, useState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme, Slider } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';
import {stub} from "sinon"
import {act} from "react-dom/test-utils"
import { assertThat, closeTo, anyOf } from "hamjest"


describe("<TimeSlider/>", () => {
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
                        num_steps={props.num_steps}
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
            const left = 0
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
        return getThumb().prop("aria-valuenow")
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
    //  value   |min    |max    |step   |steps  |pixels |mouse steps
        [500,    0,      1000,   1,     1000,   1000,   1]
    ]
    describe.each(tests)("when value: %d, min: %d, max: %d, step: %d, num_steps: %d, num_pixels: %d",
        (value: number, min: number, max: number, step: number, num_steps: number, num_pixels: number, mouse_steps: number) => {
        beforeEach(() => {
            wrapper = createSlider({value, step, num_steps, min, max, num_pixels})
        })
        const ratio_to_pixel = (ratio: number) => {
            return Math.round(num_pixels*ratio)
        }

        const value_to_pixel = (value: number) => {
            const range = max - min
            const relative_value = value - min
            return ratio_to_pixel(relative_value / range)
        }

        const ratio_to_value = (ratio: number) => {
            const range = max - min
            return min + range*ratio
        }

        it("sets the initial value corectly", () => {
            expect(getValue()).toBeFloat(value)
        })
        it("sets min correctly", () => {
            expect(getMin()).toBeFloat(min)
        })
        it("sets max correctly", () => {
            expect(getMax()).toBeFloat(max)
        })
        it("increments when moving forward", () => {
            pressRight()
            expect(getValue()).toBeFloat(value+step)
        })
        it("decrements when moving backward", () => {
            pressLeft()
            expect(getValue()).toBeFloat(value-step)
        })
        it("returns to the same value when moving forward and back", () => {
            pressRight()
            pressLeft()
            expect(getValue()).toBeFloat(value)
        })
        it("moves to the end when pressing end", () => {
            pressEnd()
            expect(getValue()).toBeFloat(max)
        })
        it("moves to the start when pressing home", () => {
            pressHome()
            expect(getValue()).toBeFloat(min)
        })
        it("does not change value when clicking in the value position", () => {
            mouseDown(value_to_pixel(value))
            expect(getValue()).toBeFloat(value, mouse_steps)
            mouseUp(value_to_pixel(value))
            expect(getValue()).toBeFloat(value, mouse_steps)
        })
        it("changes value when clicking", () => {
            // Note we allow the value to vary by one extra mouse step
            mouseDown(ratio_to_pixel(0.37))
            expect(getValue()).toBeFloat(ratio_to_value(0.37), mouse_steps*2)
            mouseUp(ratio_to_pixel(0.37))
            expect(getValue()).toBeFloat(ratio_to_value(0.37), mouse_steps*2)
        })
        it("changes value when clicking another position", () => {
            // Note we allow the value to vary by one extra mouse step
            mouseDown(ratio_to_pixel(0.79))
            expect(getValue()).toBeFloat(ratio_to_value(0.79), mouse_steps*2)
            mouseUp(ratio_to_pixel(0.79))
            expect(getValue()).toBeFloat(ratio_to_value(0.79), mouse_steps*2)
        })
        it("can drag mouse through all values with mouse steps", () => {
            const tolerance = 1e-12
            const start_pixel = value_to_pixel(value)
            let current_value = value
            mouseDown(start_pixel)
            expect(getValue()).toBeFloat(value, mouse_steps)
            // Drag backwards towards min
            for(let i=start_pixel;i>=0;--i) {
                mouseMove(i)
                const new_value = getValue()
                assertThat(new_value, 
                    anyOf(
                        closeTo(current_value, tolerance),
                        closeTo(current_value-mouse_steps, tolerance)
                ))
                if (Math.abs(current_value - new_value)<=mouse_steps+tolerance) {
                    current_value = new_value
                }
            }
            assertThat(getValue(), closeTo(min, tolerance))
            mouseMove(start_pixel)
            current_value = getValue()
            assertThat(current_value, closeTo(value, tolerance))
            // Drag slightly past the end to make sure that the last value is included
            for(let i=start_pixel;i<num_pixels+10;++i) {
                mouseMove(i)
                const new_value = getValue()
                assertThat(new_value, 
                    anyOf(
                        closeTo(current_value, tolerance),
                        closeTo(current_value+mouse_steps, tolerance)
                ))
                if (Math.abs(current_value - new_value)<=mouse_steps+tolerance) {
                    current_value = new_value
                }
            }
        })
    })
})