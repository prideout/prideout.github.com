---
layout: page
tags : [opengl, rendering]
description : "Discusses an interesting way to encode unsigned distance."
thumbnail : CpcfIcon-masked.png
---
{% include JB/setup %}

<a href="{{ ASSET_PATH }}/figures/CpcfHeader.png">
<img src="{{ ASSET_PATH }}/thumbnails/CpcfHeader.png" class="nice-image">
</a>

<!--
    post should mention heman for CPU-based...
    mention this post in your old post
-->

# Closest Point Coordinate Fields

This post introduces closest point coordinate fields (CPCF's), which are two-channel images related to Voronoi diagrams and distance fields.

<!--CPCF's are useful for pick sheets and map coloration, and might have applications in path planning, collision detection, and rendering that I don't know about yet.-->
The image in the far left panel is an example seed image and its CPCF is depicted to its right.  The CPCF was easily transformed into the Voronoi diagram and distance field shown in the two rightmost panels.

---

The _Euclidean distance transform_ (EDT) can be defined as the following function, which consumes a set of seed points <math><mi>&#x1D4AE;</mi></math> and produces a value for every <math><mi>p</mi></math> in <math><msup><mi>&#x211D;</mi><mi>2</mi></msup></math>:

<math display="block">
    <mi>d</mi>
    <mfenced>
        <mi>p</mi>
    </mfenced>
    <mo>=</mo>
    <munder>
        <mi>min</mi>
        <mrow>
            <mi>q</mi>
            <mo>&#x2208;</mo>
            <mi>&#x1D4AE;</mi>
        </mrow>
    </munder>
    <mfenced open="&#x2225;" close="&#x2225;" separators="">
        <mi>p</mi><mo>-</mo><mi>q</mi>
    </mfenced>
</math>

Sampling the above function over a grid results in an unsigned distance field.  (As opposed to a _signed distance field_, which can be generated via composition with an EDT that takes the complement of <math><mi>&#x1D4AE;</mi></math>.)

[Felzenszwalb and Huttenlocher](http://cs.brown.edu/~pff/dt/index.html) generalized this into the following equation, which is easiest to understand when considering a function <math><mi>f</mi></math> that returns 0 if its input is in  &#x1D4AE;, and &#x221E; otherwise.

<math display="block">
<mrow>
<mi>d</mi>
<mfenced>
    <mi>p</mi>
</mfenced>
<mo>=</mo>
<munder>
    <mi>min</mi>
    <mrow>
        <mi>q</mi>
        <mo>&#x2208;</mo>
        <msup><mi>&#x211D;</mi><mi>2</mi></msup>
    </mrow>
</munder>
<mfenced>
  <mrow>
    <mfenced open="&#x2225;" close="&#x2225;" separators="">
        <mi>p</mi><mo>-</mo><mi>q</mi>
    </mfenced>
    <mo>+</mo>
    <mi>f</mi>
    <mfenced>
        <mi>q</mi>
    </mfenced>
  </mrow>
</mfenced>
</mrow>
</math>

This led to their linear-time algorithm, which is probably the best way to generate the SDF on a CPU, because it's simple and fast.

Next I'd like to introduce a new function that leverages the EDT function, but produces a set of points instead of a scalar value:

<math display="block">
    <mi>g</mi><mfenced><mi>p</mi></mfenced>
    <mo>=</mo>
    <mo>{</mo>
    <mi>q</mi>
    <mo>&#x2208;</mo>
    <mi>&#x1D4AE;</mi>
    <mspace depth="0.5ex" height="0.5ex" width="1ex">
    </mspace>
    <mo>|</mo>
    <mspace depth="0.5ex" height="0.5ex" width="1ex">
    </mspace>
    <mi>d</mi><mfenced><mi>q</mi></mfenced>
    <mo>=</mo>
    <mi>d</mi><mfenced><mi>p</mi></mfenced>
    <mo>}</mo>
</math>

The above function usually results in a set that has only one element.  The set has multiple items only when several seed points "tie for first place", which occurs along the edges of the Voronoi diagram produced by <math><mi>&#x1D4AE;</mi></math>.

Let's just pick a random tiebreaker from each set; we'll call this <math><msub><mi>g</mi><mn>0</mn></msub></math> instead of <math><mi>g</mi></math>.  If we sample <math><msub><mi>g</mi><mn>0</mn></msub></math> over a grid, the result is the CPCF.

Typically you can accurately represent a CPCF using an image format that has two 16-bit integers per pixel, for a total of 32 bits per pixel.

The CPCF is cool because it can be trivially transformed into a distance field, but encodes more information than a distance field.  Another cool thing about CPCF's is that they result from Rong and Tan's [jump flooding](https://sites.google.com/site/rongguodong/) algorithm, which is probably the fastest way to compute a distance field on a GPU.

Here's how to transform a CPCF into a distance field:

<math display="block">
    <mi>d</mi><mfenced><mi>p</mi></mfenced>
    <mo>=</mo>
    <mfenced open="&#x2225;" close="&#x2225;" separators="">
        <mi>p</mi>
        <mo>-</mo>
        <msub><mi>g</mi><mn>0</mn></msub>
        <mfenced><mi>p</mi></mfenced>
    </mfenced>
</math>

In GLSL, transforming a CPCF into a distance field looks like this:

    dist = distance(uv, texture(cpcf, uv).st);
    gl_FragColor = vec4(dist, dist, dist, 1);

Voronoi diagrams can also be trivially derived from coordinate fields, if you bind the seed image to a second texture stage.  In GLSL, this transformation looks like this:

    vec2 st = texture(cpcf, uv).st;
    gl_FragColor = texture(seed, st);

# Applications

## Warped CPCF's

In the following image sequence, we apply a warping operation to the CPCF using several octaves of Perlin noise.  The resulting Voronoi diagram is terrain-like, with interesting political boundaries.  In the last panel, we use the implicit distance field to create mountains and radiating contours.

<a href="{{ ASSET_PATH }}/figures/CpcfNoisy.png">
<img src="{{ ASSET_PATH }}/thumbnails/CpcfNoisy.png" class="nice-image">
</a>

These images were generated using the archipelago functionality ([doc page](http://heman.readthedocs.org/en/latest/generate.html#archipelagos)) in the heman C library ([github project](https://github.com/prideout/heman)).

<!--
We use some of the techniques in this post to generate the maps at [mappable.com](http://mappable.com), which you should definitely check out if you're into music!
-->

## Picking

![DistancePicking Screenshot]({{ BASE_PATH }}/assets/figures/CpcfPicking.png){: .nice-image .small-image}

One use of CPCF's is fuzzy picking.  With modern GPU's, you can continuously perform jump flooding on a low-resolution framebuffer in real time.  By making an O(1) lookup into the resulting CPCF, you can obtain the nearest "pixel of interest" relative to the user's touch point.

## High Quality Magnification of Voronoi Diagrams

Another nice thing about coordinate fields is that they allow you to perform high quality magnification of Voronoi diagrams using only image data.

Note that sub-pixel accuracy is possible, if you encode a floating-point coordinate when generating the seed image!

<i>
Philip Rideout
<br>
October 2015
</i>

---

<i style="font-size:8px">Coffee should be hot as hell, black as the devil, pure as an angel, sweet as love.</i>
