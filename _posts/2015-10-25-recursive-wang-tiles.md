---
layout: page
tags : [opengl]
description : "My single-file C library for generating progressive blue noise sequences via Recursive Wang Tiles."
thumbnail : RWT-masked.png
---
{% include JB/setup %}

# 2D Point Sequences

Way back in 2007, Robert Bridson came up with an elegant way of generating a well-distributed set of points (D3 animations [here](http://bl.ocks.org/mbostock/19168c663618b7f07158) and [here](http://bl.ocks.org/mbostock/dbb02448b0f93e4c82c3)).  This algorithm is awesome for a number of reasons, one of which being that it can create points with arbitrary dimensionality.  However it should be noted that it does not create _progressive_ sequences.  In a progressive sequence, points are ordered such that any subset consisting of the N points is Poisson disk distributed over the entire range.

The Recursive Wang Tiles method for generating blue noise ([Kopf 2006](http://github.prideout.net/rwt/Kopf2006.pdf)) can quickly generate a progressive sequence by consuming a small set of pre-generated tiles.  On the downside, these tiles are complex to construct.

Here's a single-file C library that implements the real-time portion of the Recursive Wang Tiles algorithm (as opposed to tile construction).

* [bluenoise.c](https://github.com/prideout/parg/blob/master/src/bluenoise.c)

To show off the library, I used emscripten to create the two demos on this page.  Below are links to the density textures used in these demos.

* [trillium.png](http://github.prideout.net/assets/trillium.png) (890 KB)
* [terrainpts.png](http://github.prideout.net/assets/terrainpts.png) (50 KB)

### Demo #1: Continuous Generation

First let's try executing the sequence generator on every frame of camera movement.  Try dragging and scrolling inside the canvas, similar to Google Maps.  If you get lost, refresh the page.

<div style="width:700px;height:350px;border:solid 2px black;position:relative">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="trillium" >
    </canvas>
</div>

<br>

The above demo is continuously re-generating a subset of a truly infinite point sequence (well, until you run into floating-point precision issues).  If you have a decent machine, this is basically real-time.

### Demo #2: Static Vertex Buffer

For a much faster frame rate, you can generate a bunch of samples ahead of time, and bake them out to a static vertex buffer.  By simply changing the draw range within the vertex buffer during camera movement, you can achieve a similar effect with very little CPU overhead.

The following demo uses a vertex buffer with about 1.4 million points, but you can only see a small number of them at a time.  Try zooming on the coastline.  Again, if you get lost, refresh the page.

<div style="width:700px;height:350px;border:solid 2px black;position:relative">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="terrainpts" >
    </canvas>
</div>

<br>

### References

* [emscripten](http://emscripten.org), an LLVM-based project that compiles C into JavaScript.
* [Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf) by Robert Bridson.
* [Recursive Wang Tiles for Real-Time Blue Noise](http://github.prideout.net/rwt/Kopf2006.pdf) by Johannes Kopf et al.

<i>
Philip Rideout
<br>
October 2015
</i>

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/terrainpts.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    var terrainpts_app = new PargApp('#terrainpts', '', baseurl);
</script>
<script src="{{ ASSET_PATH }}/scripts/trillium.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var trillium_app = new PargApp('#trillium', '', baseurl);
</script>
