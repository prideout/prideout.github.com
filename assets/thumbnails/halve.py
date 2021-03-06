#!/usr/bin/python
import Image, ImageEnhance, ImageFilter, sys, os

root, ext = os.path.splitext(sys.argv[1])

resized = root.split('-')[0] + "-halved" + ext
sourcef = root + ext

im = Image.open(sourcef)
w,h = im.size
im.thumbnail((w/2,h/2), Image.ANTIALIAS)
im.save(resized)

