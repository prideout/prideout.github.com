#!/usr/bin/python

import cairo
import os
import math
import platform

svgfile, pngfile = ("FontMap.svg", "FontMap.png")

foreground = (0,0,0)
background = (1,1,1)

size = (1400*2, 108*8-40)
surface = cairo.SVGSurface(svgfile, *size)
cr = cairo.Context(surface)

cr.set_source_rgb(*background)
cr.rectangle(0, 0, size[0], size[1])
#cr.fill()

def text(str, x, y):
    x_bearing, y_bearing, width, height = cr.text_extents(str)[:4]
    cr.move_to(x - width / 2 - x_bearing, y - height / 2 - y_bearing)
    cr.show_text(str)
    return width, height

cr.select_font_face("Monospace", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD) # NORMAL)
cr.set_font_size(192)
cr.set_source_rgb(*foreground)
#width, height = text("Hellop", 128, 16)

cr.set_source_rgb(*background)
cr.rectangle(0, 0, 256, 32)
#cr.fill()

s = ""
for i in xrange(ord(' '), 1 + ord('~')):
    s = s + chr(i)
print s

t1 = len(s)/4+1
t2 = 2*len(s)/4+1
t3 = 3*len(s)/4+1
s1, s2, s3, s4 = s[:t1], s[t1:t2], s[t2:t3], s[t3:]

x_bearing, y_bearing, width, height = cr.text_extents(s)[:4]
cr.set_source_rgb(*foreground)
cr.move_to(2, -y_bearing + 2)
cr.show_text(s1)
cr.move_to(2, -y_bearing + 2 + height)
cr.show_text(s2)
cr.move_to(2, -y_bearing + 2 + height*2)
cr.show_text(s3)
cr.move_to(2, -y_bearing + 2 + height*3)
cr.show_text(s4)

width = width + x_bearing
print width, height
print width / len(s)

surface.write_to_png(pngfile)
surface = 0
os.system("gnome-open " + svgfile)
