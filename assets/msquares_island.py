#! /usr/bin/env python

"Generate a random island."

import heman
import numpy as np
import time
import PIL.Image
import PIL.ImageDraw
import PIL.ImageEnhance


def generate_island():
    elevation = heman.Generate.island_heightmap(1024, 1024, 101)
    grad = heman.Color.create_gradient(256, GRADIENT)
    albedo = heman.Color.apply_gradient(elevation, -0.5, 0.5, grad)
    final = heman.Lighting.apply(elevation, albedo, 1, 1, 0.5, LIGHTPOS)
    array = heman.Export.u8(final, 0, 1)
    im = PIL.Image.fromarray(array, 'RGB')
    im.save('island.png')
    open('island.1024.bin', 'wb').write(elevation.array)

    array = heman.Export.u8(elevation, -1, 1)
    im = PIL.Image.fromarray(array, 'L')
    im.save('msquares_island_hmap.png')


GRADIENT = [
    000, 0x001070,
    126, 0x2C5A7C,
    127, 0xE0F0A0,
    128, 0x5D943C,
    160, 0x606011,
    200, 0xFFFFFF,
    255, 0xFFFFFF,
]

LIGHTPOS = (-.5, .5, 1)

if __name__ == '__main__':
    import multiprocessing
    print multiprocessing.cpu_count(), 'cores'
    start_time = time.time()
    generate_island()
    elapsed = time.time() - start_time
    print('{:.3f} seconds.'.format(elapsed))
