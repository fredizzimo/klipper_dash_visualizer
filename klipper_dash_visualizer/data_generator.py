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

        self.times, self.spatial_coordinates = self.generate_spatial_coordinates(parser)

    def generate_spatial_coordinates(self, parser):
        spatial_steppers = parser.get_spatial_steppers()
        if len(spatial_steppers):
            spatial_steppers = [self.steppers[i] for i in spatial_steppers]

            lhs =  spatial_steppers[0]
            lhs_time = lhs.time
            lhs_pos = lhs.position
            lhs_size = lhs.time.shape[0]

            output_size = lhs_size + spatial_steppers[1].time.shape[0]
            cur_col = 2

            for rhs in spatial_steppers[1:]:
                output_size = lhs_size + rhs.time.shape[0] 
                output = np.empty((output_size, cur_col+1))
                i = 0
                j = 0
                rhs_size = rhs.time.shape[0]
                size = 0

                prev_lhs = np.zeros((cur_col-1,))
                prev_rhs = 0.0

                while i<lhs_size and j < rhs_size:
                    if lhs_time[i] < rhs.time[j]:
                        output[size,0] = lhs_time[i]
                        output[size,1:cur_col] = lhs_pos[i]
                        output[size,cur_col] = prev_rhs
                        prev_lhs = lhs_pos[i]
                        i += 1
                    elif lhs_time[i] > rhs.time[j]:
                        output[size,0] = rhs.time[j]
                        output[size,1:cur_col] = prev_lhs
                        output[size,cur_col] = rhs.position[j]
                        prev_rhs = rhs.position[j]
                        j += 1
                    else:
                        output[size,0] = lhs_time[i]
                        output[size,1:cur_col] = lhs_pos[i]
                        output[size,cur_col] = rhs.position[j]
                        prev_lhs = lhs_pos[i]
                        prev_rhs = rhs.position[j]
                        i += 1
                        j += 1
                    size += 1
                
                while i < lhs_size:
                    output[size,0] = lhs_time[i]
                    output[size,1:cur_col] = lhs_pos[i]
                    output[size,cur_col] = prev_rhs
                    prev_lhs = lhs_pos[i]
                    i += 1
                    size += 1

                while j < rhs_size:
                    output[size,0] = rhs.time[j]
                    output[size,1:cur_col] = prev_lhs
                    output[size,cur_col] = rhs.position[j]
                    prev_rhs = rhs.position[j]
                    j += 1
                    size += 1
                
                lhs_size = size
                lhs_pos = output[:,1:]
                lhs_time = output[:,0]
                cur_col += 1
        
            times = output[:size,0].copy()
            spatial_coordinates = output[:size,1:].copy()
            for i in xrange(spatial_coordinates.shape[0]):
                spatial_coordinates[i,:] = parser.get_spatial_coordinate(spatial_coordinates[i,:])

            spatial_coordinates = spatial_coordinates.reshape(3*size)
            return (times, spatial_coordinates)
        else:
            return ([], [])