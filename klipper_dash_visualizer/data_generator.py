import numpy as np


class Stepper(object):
    def __init__(self, name):
        self.name = name
        self.time = None
        self.position = None
        self.velocity = None
        self.acceleration = None

    def calculate_velocities_and_accelerations(self):
        length = self.time.shape[0]
        if length < 3:
            self.velocity = np.zeros(length)
            self.acceleration = np.zeros(length)
            return
        
        self.velocity = np.empty(length)
        self.acceleration = np.empty(length)
        # Assume that the first and last velocities and accelerations are zero
        self.velocity[0] = 0.0
        self.velocity[-1] = 0.0
        self.acceleration[0] = 0.0
        self.acceleration[-1] = 0.0

        # Calcuate the rest using 3 point central differences
        diffs = self.time[1:] - self.time[:-1]
        diffs_2 = diffs**2

        diffs_p0 = diffs[:-1]
        diffs_p2 = diffs[1:]

        diffs_2_p0 = diffs_2[:-1]
        diffs_2_p2 = diffs_2[1:]

        f_0 = self.position[0:-2]
        f_1 = self.position[1:-1]
        f_2 = self.position[2:]

        b = diffs_p0*diffs_p2
        a = diffs_2_p0 + b
        c = diffs_2_p2 + b

        self.velocity[1:-1] = f_1 * (diffs_p2 - diffs_p0) / b
        self.velocity[1:-1] -= f_0 * diffs_p2 / a
        self.velocity[1:-1] += f_2 * diffs_p0 / c

        self.acceleration[1:-1] = (f_0 / a) * 2.0
        self.acceleration[1:-1] -= (f_1 / b) * 2.0
        self.acceleration[1:-1] += (f_2 / c) * 2.0

class DataGenerator(object):
    def __init__(self, parser):
        self.parser = parser
        self.steppers = [Stepper(name) for name in parser.get_stepper_names()]
        for i, stepper in enumerate(self.steppers):
            steps = np.array(list(parser.get_steps(i, 0)))
            stepper.time = steps[:,0]
            stepper.position = steps[:,1]
            stepper.calculate_velocities_and_accelerations()
