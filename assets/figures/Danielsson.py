#!/usr/bin/python

import os
import platform
import math
import Image

spreadFactor = 50
scale = 0.25
sourceFile = "FontMap.png"
destFile = "/home/prideout/github/recipes/FontMap.png"

def platform_open(str):
    """Open specified file using your window manager's preferred application"""
    os.system("gnome-open " + str)

def _invert(c):
    return 255 - c
    
def invert(c):
    if c < 128:
        return 255
    return 0

def initCell(pixel):
    if pixel == 0: return inside
    return outside

def distSq(cell):
    return cell[0] * cell[0] + cell[1] * cell[1]

def getCell(grid, x, y):
    if y < 0 or y >= len(grid): return inside
    if x < 0 or x >= len(grid[y]): return inside
    return grid[y][x]

def compare(grid, cell, x, y, ox, oy):
    other = getCell(grid, x + ox, y + oy)
    other = (other[0] + ox, other[1] + oy)
    if distSq(other) < distSq(cell): return other
    return cell

def sweep(grid, cell, x, y, template):
    for ox, oy in template:
        cell = compare(grid, cell, x, y, ox, oy)
    return cell

def propagate(grid):
    for y in xrange(0, height):
        for x in xrange(0, width):
            cell = grid[y][x]
            template = (-1, 0), (0, -1), (-1, -1), (1, -1)
            cell = sweep(grid, cell, x, y, template)
            grid[y][x] = cell
        for x in xrange(width - 1, -1, -1):
            cell = grid[y][x]
            template = (1, 0),
            cell = sweep(grid, cell, x, y, template)
            grid[y][x] = cell
    for y in xrange(height - 1, -1, -1):
        for x in xrange(width - 1, -1, -1):
            cell = grid[y][x]
            template = (1, 0), (0, 1), (-1, 1), (1, 1)
            cell = sweep(grid, cell, x, y, template)
            grid[y][x] = cell
        for x in xrange(0, width):
            cell = grid[y][x]
            template = (-1, 0),
            cell = sweep(grid, cell, x, y, template)
            grid[y][x] = cell

print "Allocating the destination image..."
inside, outside = (0,0), (9999, 9999)
sourceImage = Image.open(sourceFile)
sourceImage.load()
alphaChannel = sourceImage.split()[3]
alphaChannel = Image.eval(alphaChannel, invert)
w = alphaChannel.size[0] + spreadFactor * 2
h = alphaChannel.size[1] + spreadFactor * 2
srcImage = Image.new("L", (w, h), 0)
srcImage.paste(alphaChannel, (spreadFactor, spreadFactor))
width, height = srcImage.size

print "Creating the two grids..."
pixels = srcImage.load()
grid0 = [[initCell(pixels[x, y]) for x in xrange(width)] for y in xrange(height)] 
grid1 = [[initCell(invert(pixels[x, y])) for x in xrange(width)] for y in xrange(height)] 

print "Propagating grid 0..."
propagate(grid0)

print "Propagating grid 1..."
propagate(grid1)

print "Subtracting grids..."
signedDistance = [[0 for x in xrange(width)] for y in xrange(height)] 
for y in xrange(height):
    for x in xrange(width):
        dist1 = math.sqrt(distSq(grid0[y][x]))
        dist0 = math.sqrt(distSq(grid1[y][x]))
        signedDistance[y][x] = dist0 - dist1

print "Normalizing..."
maxDist, minDist = spreadFactor, -spreadFactor
for y in xrange(height):
    for x in xrange(width):

        # Unsigned Distance        
        if False:
            dist = -signedDistance[y][x]
            if dist < 0: dist = 0
            else: dist = 255 * dist / maxDist
            if dist > 255: dist = 255
            signedDistance[y][x] = int(dist)
            pixels[x, y] = signedDistance[y][x]
            
        # Signed Distance        
        if True:
            dist = signedDistance[y][x]
            if dist < 0: dist = -128 * (dist - minDist) / minDist
            else: dist = 128 + 128 * dist / maxDist
            if dist < 0: dist = 0
            elif dist > 255: dist = 255
            signedDistance[y][x] = int(dist)
            pixels[x, y] = 255 - signedDistance[y][x]

if True:
    print "Scaling..."
    srcImage.thumbnail((int(width * scale), int(height * scale)))

print "Saving %s..." % destFile
srcImage.save(destFile)
platform_open(destFile)
