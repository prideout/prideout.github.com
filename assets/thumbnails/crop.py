#!/usr/bin/python
import Image, sys, os

root, ext = os.path.splitext(sys.argv[1])

cropped = root + "-cropped.png"
sourcef = root + ext

im = Image.open(sourcef)

target = (853,480)

xmargin = (im.size[0] - target[0]) / 2
ymargin = (im.size[1] - target[1]) / 2

cr = im.crop((xmargin,ymargin,target[0],target[1]))
cr.save(cropped)
