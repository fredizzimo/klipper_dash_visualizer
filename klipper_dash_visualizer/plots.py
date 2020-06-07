def get_plot_data(data):
    plots = [
        {
            "name": stepper.name,
            "traces": [
                {
                    "name": "pos",
                    "data": stepper.position
                },
                {
                    "name": "vel",
                    "data": stepper.velocity
                },
                {
                    "name": "acc",
                    "data": stepper.acceleration
                },
            ],
            "times": stepper.time
        }
        for stepper in data.steppers
    ]
    plots.append({
        "name": "Global",
        "traces": [
            {
                "name": "vel",
                "data": data.velocities
            },
            {
                "name": "acc",
                "data": data.accelerations
            },
        ],
        "times": data.times
    })
    return plots