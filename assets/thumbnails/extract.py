#!/usr/bin/python
import Image, sys, os

root, ext = os.path.splitext(sys.argv[1])

cropped = root + "-cropped" + ext
resized = root + "-resized" + ext
sourcef = root + ext

im = Image.open(sourcef)
if im.size != (857,510):
    panic("wrong size")

cr = im.crop((2,26,855,506))
cr.save(cropped)
cr.thumbnail((128,76), Image.ANTIALIAS)
cr.save(resized)

