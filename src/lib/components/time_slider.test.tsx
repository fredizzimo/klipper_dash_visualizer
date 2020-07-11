import React, {FunctionComponent, useState} from "react"
import {TimeSlider} from "./time_slider"
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { createMount } from '@material-ui/core/test-utils';

describe("<TimeSlider/>", () => {
    const total_steps = 501

    let mount: ReturnType<typeof createMount>

    beforeAll(() => {
        mount = createMount()
    })

    afterAll(() => {
        mount.cleanUp()
    })

    const createSlider=(args: {value: number, step: number, num_steps: number, min: number, max: number}) => {
        const {value, step, num_steps, min, max} = args
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
        return wrapper
    }

    let wrapper: ReturnType<typeof createSlider>

    const getThumb = () => {
        return wrapper.find('[role="slider"]')
    }

    describe("when initialized with one pixel per step", () => {
        const num_pixels = 1001
        const num_steps = 1001
        const step = 1
        describe("when the range matches exactly", () => {
            const value = 500
            const min = 0
            const max = 1000
            beforeEach(() => {
                wrapper = createSlider({value, step, num_steps, min, max})
            })
            it("sets the initial value corectly", () => {
                expect(getThumb().prop("aria-valuenow")).toBeFloat(value)
            })
            it("sets min correctly", () => {
                expect(getThumb().prop("aria-valuemin")).toBeFloat(min)
            })
            it("sets max correctly", () => {
                expect(getThumb().prop("aria-valuemax")).toBeFloat(max)
            })
            it("increments when moving forward", () => {
                getThumb().simulate("keyDown", {key: "ArrowRight"})
                expect(getThumb().prop("aria-valuenow")).toBeFloat(value+1)
            })
            it("decrements when moving backward", () => {
                getThumb().simulate("keyDown", {key: "ArrowLeft"})
                expect(getThumb().prop("aria-valuenow")).toBeFloat(value-1)
            })
            it("returns to the same value when moving forward and back", () => {
                getThumb().simulate("keyDown", {key: "ArrowRight"})
                getThumb().simulate("keyDown", {key: "ArrowLeft"})
                expect(getThumb().prop("aria-valuenow")).toBeFloat(value)
            })
            it("moves to the end when pressing end", () => {
                getThumb().simulate("keyDown", {key: "End"})
                expect(getThumb().prop("aria-valuenow")).toBeFloat(max)
            })
            it("moves to the start when pressing home", () => {
                getThumb().simulate("keyDown", {key: "Home"})
                expect(getThumb().prop("aria-valuenow")).toBeFloat(min)
            })
        })
    })
})