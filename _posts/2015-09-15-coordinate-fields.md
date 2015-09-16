---
layout: page
tags : [opengl]
description : "Coordinate fields: more powerful than distance fields."
thumbnail : Heman-masked.png
---
{% include JB/setup %}

# Coordinate Fields

One way to define the _Euclidean distance transform_ (EDT) is like this:

[math]

The domain of the above function is often called a _seed image_, and the range is often called a _signed distance field_ (SDF).

[Felzenszwalb and Huttenlocher](http://) generalized this into the following equation, which led to their super-fast algorithm, which is probably the best way to generate the SDF on a CPU.

[math]

I'd like to introduce another variation of these equation, which is basically just a way to write the _Voronoi transform_:

[math]

When uniformly sampling the range of the above function, the result is a grid of locations in the seed image.  These 2D-valued _coordinate fields_ are super cool because they encode more information than 1D-valued distance fields.

Coordinate fields are generated from the [Rong and Tan](http://) algorithm, which is probably the fastest way to compute an EDT on a GPU.  It's so fast that it can be executed in real time, as shown in the first WebGL demo below.

Distance fields can be trivially derived from coordinate fields:

[image] => [RG image] => [image]

In GLSL, this transformation looks like this:

    dist = distance(uv, texture(coordfield, uv));
    gl_FragColor = vec4(dist, dist, dist, 1);

Voronoi diagrams can also be trivially derived from coordinate fields:

[image] => [RG image] => [image]

In GLSL, this transformation looks like this:

    vec2 st = texture(coordfield, uv);
    gl_FragColor = texture(seed, st);

# Picking

[spinning trefoil with contour lines and a black line from cursor to nearest point]

If the user moves the cursor around in the canvas, the demo performs an O(1) lookup into the coordinate field to find the nearest point, then draws a line to that point.  This technique is potentially very useful when implementing object selection.

# Infinite Zoom

Another nice thing about coordinate fields is that they can be perfectly magnified.

[Another WebGL demo, with a 2x1 viewport.  Left half has a draggable zoom box that can't be resized.  Right half is the zoom.]

Note that sub-pixel accuracy is possible, if you encode a floating-point coordinate when generating the seed image!

# Noisy Coordinate Fields

Political boundaries.

We use some of the techniques in this post to generate the maps at [mappable.com](http://mappable.com), which you should definitely check out if you're into music!
