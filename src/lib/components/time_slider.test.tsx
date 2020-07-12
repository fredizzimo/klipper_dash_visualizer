import React, {FunctionComponent, useState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme, Slider } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';
import {stub} from "sinon"
import {act} from "react-dom/test-utils"


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

    describe("when initialized with one pixel per step", () => {
        const num_pixels = 1000
        const num_steps = 1000
        const step = 1
        describe("when the range matches exactly", () => {
            const value = 500
            const min = 0
            const max = 1000
            beforeEach(() => {
                wrapper = createSlider({value, step, num_steps, min, max, num_pixels})
            })
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
                expect(getValue()).toBeFloat(value+1)
            })
            it("decrements when moving backward", () => {
                pressLeft()
                expect(getValue()).toBeFloat(value-1)
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
            it("does not change value when clicking in the middle", () => {
                mouseDown(value)
                expect(getValue()).toBeFloat(value)
                mouseUp(value)
                expect(getValue()).toBeFloat(value)
            })
            it("changes value when clicking", () => {
                mouseDown(307)
                expect(getValue()).toBeFloat(307)
                mouseUp(307)
                expect(getValue()).toBeFloat(307)
            })
            it("handles mouse dragging", () => {
                mouseDown(600)
                expect(getValue()).toBeFloat(600)
                mouseMove(700)
                expect(getValue()).toBeFloat(700)
                // Note: The actual mouse curser is outside the slider here
                mouseMove(max)
                expect(getValue()).toBeFloat(max)
                mouseMove(min)
                expect(getValue()).toBeFloat(min)
                mouseMove(value)
                expect(getValue()).toBeFloat(value)
            })
        })
    })
})