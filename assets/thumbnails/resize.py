#!/usr/bin/python
import Image, ImageEnhance, ImageFilter, sys, os

root, ext = os.path.splitext(sys.argv[1])

resized = root.split('-')[0] + "-resized" + ext
sourcef = root + ext

im = Image.open(sourcef)

#im = im.filter(ImageFilter.MedianFilter(4))

im.thumbnail((128,76), Image.ANTIALIAS)

#enhancer = ImageEnhance.Sharpness(im)
#im = enhancer.enhance(2.0)

im.save(resized)

