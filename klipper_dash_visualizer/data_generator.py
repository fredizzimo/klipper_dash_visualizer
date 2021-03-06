import numpy as np
from colormap import turbo_color_map
from ramer_douglas_peucker import rdp

def calculate_velocities_and_accelerations(times, positions):
    length = times.shape[0]
    if length < 3:
        return np.zeros(length), np.zeros(length)
    
    velocity = np.empty(length)
    acceleration = np.empty(length)
    # Assume that the first and last velocities and accelerations are zero
    velocity[0] = 0.0
    velocity[-1] = 0.0
    acceleration[0] = 0.0
    acceleration[-1] = 0.0

    # Calcuate the rest using 3 point central differences
    diffs = times[1:] - times[:-1]
    diffs_2 = diffs**2

    diffs_p0 = diffs[:-1]
    diffs_p2 = diffs[1:]

    diffs_2_p0 = diffs_2[:-1]
    diffs_2_p2 = diffs_2[1:]

    f_0 = positions[0:-2]
    f_1 = positions[1:-1]
    f_2 = positions[2:]

    b = diffs_p0*diffs_p2
    a = diffs_2_p0 + b
    c = diffs_2_p2 + b

    velocity[1:-1] = f_1 * (diffs_p2 - diffs_p0) / b
    velocity[1:-1] -= f_0 * diffs_p2 / a
    velocity[1:-1] += f_2 * diffs_p0 / c

    acceleration[1:-1] = (f_0 / a) * 2.0
    acceleration[1:-1] -= (f_1 / b) * 2.0
    acceleration[1:-1] += (f_2 / c) * 2.0

    return velocity, acceleration

def merge_steppers(steppers):
    if len(steppers):
        lhs_time = steppers[0].time
        lhs_size = lhs_time.shape[0]
        lhs = np.arange(0, lhs_size)

        output_size = lhs_size + steppers[1].time.shape[0]

        for cur_col, rhs in enumerate(steppers[1:], start=1):
            output_size = lhs_size + rhs.time.shape[0] 
            times = np.empty((output_size, 1))
            output = np.empty((output_size, cur_col+1), dtype=np.uint32)
            i = 0
            j = 0
            rhs_size = rhs.time.shape[0]
            size = 0

            prev_lhs = np.zeros((cur_col+1,))
            prev_rhs = 0.0

            while i<lhs_size and j < rhs_size:
                if lhs_time[i] < rhs.time[j]:
                    times[size] = lhs_time[i]
                    output[size,:cur_col] = lhs[i]
                    output[size,cur_col] = prev_rhs
                    prev_lhs = lhs[i]
                    i += 1
                elif lhs_time[i] > rhs.time[j]:
                    times[size] = rhs.time[j]
                    output[size,:cur_col] = prev_lhs
                    output[size,cur_col] = j
                    prev_rhs = j
                    j += 1
                else:
                    times[size] = lhs_time[i]
                    output[size,:cur_col] = lhs[i]
                    output[size,cur_col] = j
                    prev_lhs = lhs[i]
                    prev_rhs = j
                    i += 1
                    j += 1
                size += 1
            
            while i < lhs_size:
                times[size] = lhs_time[i]
                output[size,:cur_col] = lhs[i]
                output[size,cur_col] = prev_rhs
                prev_lhs = lhs[i]
                i += 1
                size += 1

            while j < rhs_size:
                times[size] = rhs.time[j]
                output[size,:cur_col] = prev_lhs
                output[size,cur_col] = rhs.position[j]
                prev_rhs = rhs.position[j]
                j += 1
                size += 1
            
            lhs_size = size
            lhs = output
            lhs_time = times
            cur_col += 1
    
        times = times[:size].copy().reshape(size)
        indices = output[:size,:].copy()

        return (times, indices)
    else:
        return np.empty(0), np.empty((0,0))

def interpolate_stepper_positions(steppers, times, spatial_indices):
    stepper_positions = np.empty((spatial_indices.shape[0], spatial_indices.shape[1]))
    for i, stepper in enumerate(steppers):
        stepper_times = stepper.time[spatial_indices[:,i]]
        positions = stepper.position[spatial_indices[:,i]]
        velocities = stepper.velocity[spatial_indices[:,i]]
        accelerations = stepper.acceleration[spatial_indices[:,i]]
        dt = times - stepper_times
        dt2 = dt*dt
        stepper_positions[:,i] = positions + velocities*dt + 0.5*accelerations*dt2
    
    return stepper_positions

def find_max_velocity(velocities):
    # Find the maximum velocity by first applying some smoothing 
    m = 0
    avg = 0
    coeff = 0.1
    coeff2 = 1.0 - coeff
    for v in velocities: 
        avg = avg*(coeff2) + v*coeff
        if avg > m:
            m=avg
    return m


def interpolate(colormap, x):
    x_scaled = x * 255.0
    a = x_scaled.astype(np.uint16)
    b = np.clip(a + 1, 0, 255)
    f = x_scaled - a
    speed_colors = np.empty((x.shape[0], 3))
    speed_colors[:,0] = colormap[a,0] + (colormap[b,0] - colormap[a,0]) * f
    speed_colors[:,1] = colormap[a,1] + (colormap[b,1] - colormap[a,1]) * f
    speed_colors[:,2] = colormap[a,2] + (colormap[b,2] - colormap[a,2]) * f
    return speed_colors

def generate_speed_colors(velocities):
    max_velocity = find_max_velocity(velocities)
    if max_velocity < 1:
        max_velocity = 1.0
    #TODO hardcoded maximum for better visualization
    # The whole functionality should be moved to the shaders so that the user 
    # can tune it manually
    max_velocity = 100.0
    velocity_multipliers = velocities / max_velocity
    np.clip(velocity_multipliers, 0.0, 1.0, out=velocity_multipliers)
    speed_colors = interpolate(turbo_color_map, velocity_multipliers)
    return speed_colors

def sample(interval, times, positions):
    input_length = times.shape[0]
    if input_length <= 2:
        return times.copy(), positions.copy()
    start_time = times[0]

    def get_max_output_length():
        start = times[0]
        end = times[-1]
        r = end - start
        num = int(r / interval)
        new_end = start + interval * num

        if new_end < end:
            num += 1
        return num

    def find_interval_end(start_idx):
        idx = start_idx
        interval_nr = int((times[idx] - start_time) / interval)
        next_interval_time = (interval_nr + 1) * interval
        while idx < input_length and times[idx] < next_interval_time:
            idx += 1
        return idx

    def calculate_triangle_areas(prev_pos, prev_time, positions, times, next_pos, next_time):
        a = prev_time - next_time
        b = positions - prev_pos 
        c = prev_time - times
        d = next_pos - prev_pos
        return 0.5 * np.abs(a*b - c*d)

    output_length = get_max_output_length()
    output_positions = np.empty(output_length)
    output_times = np.empty(output_length)

    prev_pos = positions[0]
    prev_time = times[0]

    output_positions[0] = prev_pos
    output_times[0] = prev_time
    output_index = 1

    prev_end_idx = find_interval_end(0) 
    cur_start_idx = prev_end_idx + 1
    cur_end_idx = find_interval_end(cur_start_idx)
    next_start_idx = cur_end_idx + 1
    next_end_idx = find_interval_end(next_start_idx)
    while next_end_idx < input_length:
        next_pos = np.mean(positions[next_start_idx:next_end_idx+1])
        next_time = np.mean(times[next_start_idx:next_end_idx+1])
        areas = calculate_triangle_areas(
            prev_pos,
            prev_time,
            positions[cur_start_idx:cur_end_idx+1],
            times[cur_start_idx:cur_end_idx+1],
            next_pos,
            next_time
        )
        cur_idx = np.argmax(areas) + cur_start_idx
        prev_pos = positions[cur_idx]
        prev_time = times[cur_idx]
        output_positions[output_index] = prev_pos
        output_times[output_index] = prev_time
        output_index += 1

        prev_end_idx = cur_end_idx
        cur_start_idx = next_start_idx
        cur_end_idx = next_end_idx
        next_start_idx = cur_end_idx + 1
        next_end_idx = find_interval_end(next_start_idx)

    output_positions[output_index] = positions[-1]
    output_times[output_index] = times[-1]

    return output_times[:output_index+1].copy(), output_positions[:output_index+1].copy()


class Stepper(object):
    def __init__(self, name):
        self.name = name
        self.time = None
        self.position = None
        self.velocity = None
        self.acceleration = None

    def calculate_velocities_and_accelerations(self):
        self.velocity, self.acceleration = calculate_velocities_and_accelerations(self.time, self.position)

class Data(object):
    def __init__(self, stepper_names):
        self.steppers = [Stepper(name) for name in stepper_names]
        self.times = None
        self.spatial_coordinates = None
        self.distances = None
        self.velocities = None
        self.accelerations = None

    def generate_distances(self):
        distances = np.diff(self.spatial_coordinates, axis=0, prepend=0.0)
        distances = np.linalg.norm(distances, axis=1)
        distances = np.cumsum(distances)
        self.distances = distances

    def generate_velocities_and_accelerations(self):
        velocities, accelerations = calculate_velocities_and_accelerations(self.times, self.distances)
        self.velocities = velocities
        self.accelerations = accelerations


class DataGenerator(Data):
    def __init__(self, parser):
        super(DataGenerator, self).__init__(parser.get_stepper_names())
        self.parser = parser

        for i, stepper in enumerate(self.steppers):
            steps = np.array(list(parser.get_steps(i, 0)))
            stepper.time = steps[:,0]
            stepper.position = steps[:,1]
            stepper.calculate_velocities_and_accelerations()

        self.times, self.spatial_coordinates = self.generate_spatial_coordinates(parser)
        self.generate_distances()
        self.generate_velocities_and_accelerations()
        self.culled_coordinates = self.cull_spatial_coordinates()
        self.speed_colors = generate_speed_colors(self.velocities)

    def sample(self, interval):
        ret = Data(self.parser.get_stepper_names())
        for ret_stepper, stepper in zip(ret.steppers, self.steppers):
            ret_stepper.time, ret_stepper.position = sample(interval, stepper.time, stepper.position) 
            ret_stepper.calculate_velocities_and_accelerations()
        ret.distances, ret.times = sample(interval, self.times, self.distances)
        ret.generate_velocities_and_accelerations()
        return ret

    def generate_spatial_coordinates(self, parser):
        spatial_steppers = parser.get_spatial_steppers()
        spatial_steppers = [self.steppers[i] for i in spatial_steppers]

        if len(spatial_steppers):
            times, spatial_indices = merge_steppers(spatial_steppers)

            spatial_coordinates  = interpolate_stepper_positions(spatial_steppers, times, spatial_indices)

            for i in xrange(spatial_coordinates.shape[0]):
                spatial_coordinates[i,:] = parser.get_spatial_coordinate(spatial_coordinates[i,:])

            return (times, spatial_coordinates)
        else:
            return ([], [])

    def cull_spatial_coordinates(self):
        return rdp(self.times, self.spatial_coordinates, 0.01)
        pass

