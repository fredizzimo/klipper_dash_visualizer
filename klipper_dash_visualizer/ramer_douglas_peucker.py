import numpy as np

def synchronized_euclidean_distance_sq(times, points, start_t, end_t, start_p, end_p):
    dir = end_p - start_p
    dt = end_t - start_t

    p_dt = (times-start_t) / dt
    p_t = np.einsum("j,i->ij", dir, p_dt) + start_p

    delta = points - p_t

    # dot product for each column
    return np.einsum('ij,ij->i', delta, delta)


def rdp(times, points, epsilon):
    dist = synchronized_euclidean_distance_sq
    epsilon_sq = epsilon*epsilon
    start_index = 0
    last_index = times.shape[0] - 1
    stk = []
    stk.append([start_index, last_index])
    global_start_index = start_index
    indices = np.ones(last_index - start_index + 1, dtype=bool)

    while stk:
        start_index, last_index = stk.pop()

        dists = dist(
            times[start_index:last_index+1],
            points[start_index:last_index+1,:], 
            times[start_index],
            times[last_index],
            points[start_index],
            points[last_index])
        index = np.argmax(dists)
        dmax = dists[index]

        if dmax > epsilon_sq:
            index = index + start_index
            stk.append([start_index, index])
            stk.append([index, last_index])
        else:
            # TODO optimize this
            for i in xrange(start_index + 1, last_index):
                indices[i - global_start_index] = False

    return indices