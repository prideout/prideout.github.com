#!/usr/bin/env python

import cairo, os, sys
from PIL import Image

def draw_rounded(cr, area, radius):
    """ draws rectangles with rounded (circular arc) corners """
    from math import pi
    a,b,c,d=area
    cr.arc(a + radius, c + radius, radius, 2*(pi/2), 3*(pi/2))
    cr.arc(b - radius, c + radius, radius, 3*(pi/2), 4*(pi/2))
    cr.arc(b - radius, d - radius, radius, 0*(pi/2), 1*(pi/2))  # ;o)
    cr.arc(a + radius, d - radius, radius, 1*(pi/2), 2*(pi/2))
    cr.close_path()
    cr.fill()

def create(outfilename, fig_size):
    w,h = fig_size
    offset = 3
    inside_area = (offset, w-offset, offset, h-offset)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, *fig_size)
    cr = cairo.Context(surface)
    cr.set_line_width(3)
    cr.set_source_rgb(1,1,1)
    draw_rounded(cr, inside_area, 45)
    surface.write_to_png(outfilename)

root, ext = os.path.splitext(sys.argv[1])
sourcef = root + ext
source = Image.open(sourcef)
if not source:
    die("Strange, can't open source.")

create("mask.png", source.size)
mask = Image.open("mask.png")
if not mask:
    die("Strange, can't open mask.")

source.load()
mask.load()

sourceChannels = source.split()
maskChannels = mask.split()
dest = Image.merge("RGBA", (sourceChannels[0:3]) + (maskChannels[3],))
#dest = Image.merge("LA", (sourceChannels[0],) + (maskChannels[3],))

masked = root.split('-')[0] + "-masked" + ext
#import code; code.interact(local=locals()) # uncomment to break debug interactive
dest.save(masked)

