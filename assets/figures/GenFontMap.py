#!/usr/bin/python

import cairo
import os
import math
import platform

svgfile, pngfile = ("FontMap.svg", "FontMap.png")

foreground = (0,0,0)
background = (1,1,1)

def init_font(cr):
    cr.select_font_face("Monospace", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD) # NORMAL)
    cr.set_font_size(64.0)
    return cr.font_extents()[:4]

# Temporary surface to determine font metrics
size = (64, 64)
surface = cairo.SVGSurface(svgfile, *size)
cr = cairo.Context(surface)
extents = init_font(cr)
print extents
(x_bearing, y_bearing, width, height) = extents
width = math.ceil(width) + 2;
height = math.ceil(height + y_bearing) + 2;

# Create the grid surface
size = (width * 24, height * 4)
surface = cairo.SVGSurface(svgfile, *size)
cr = cairo.Context(surface)
print init_font(cr)
cr.set_source_rgb(*background)
cr.rectangle(0, 0, size[0], size[1])
cr.fill()

s = ""
for i in xrange(ord(' '), 1 + ord('~')):
    s = s + chr(i)
print s

cr.set_source_rgb(*foreground)
g = ord(' ') - 29 # No clue how this works.
y = y_bearing
for row in xrange(4):
    x = 0
    for col in xrange(24):
        cr.show_glyphs([(g, x, y)])
        g = g + 1
    y = y + height + y_bearing


surface.write_to_png(pngfile)
surface = 0
os.system("gnome-open " + svgfile)
