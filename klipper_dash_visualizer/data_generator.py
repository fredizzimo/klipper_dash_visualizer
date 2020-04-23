import numpy as np


class Stepper(object):
    def __init__(self, name):
        self.name = name
        self.time = None
        self.position = None
        self.velocity = None
        self.acceleration = None

class DataGenerator(object):
    def __init__(self, parser):
        self.parser = parser
        self.steppers = [Stepper(name) for name in parser.get_stepper_names()]
        for i, stepper in enumerate(self.steppers):
            steps = np.array(list(parser.get_steps(i, 0)))
            stepper.time = steps[:,0]
            stepper.position = steps[:,1]
            # TODO: Should be calculated here
            stepper.velocity = parser.steppers[i].velocity
            stepper.acceleration = parser.steppers[i].acceleration
