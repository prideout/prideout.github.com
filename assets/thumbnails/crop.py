#!/usr/bin/python
import Image, sys, os

root, ext = os.path.splitext(sys.argv[1])

cropped = root.split('-')[0] + "-cropped.png"
sourcef = root + ext

im = Image.open(sourcef)

#target = (853,480)
target = (710,400)

xmargin = 20+(im.size[0] - target[0]) / 2
ymargin = (im.size[1] - target[1]) / 2

cr = im.crop((xmargin,ymargin,target[0] + xmargin,target[1]+ymargin))
cr.save(cropped)
