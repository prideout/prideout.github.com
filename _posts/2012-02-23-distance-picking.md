---
layout: post
tags : [opengl]
description : "Create a distance field on the GPU, use it for point selection."
thumbnail : DistancePicking-masked.png
---
{% include JB/setup %}

This is an idea I have for using the GPU to assist in nearest point calculations.  I'm not sure how useful it is in practice, but it's one way to avoid the overhead of a spatial bounding hierarchy for simple picking operations.

The following screenshot shows how my demo highlights the surface point nearest to the mouse cursor.  As you move the mouse, the selected point slides around interactively.

![DistancePicking Screenshot]({{ BASE_PATH }}/assets/thumbnails/DistancePicking-halved.png)

The basic premise is to render your objects to an offscreen buffer with screen-space (X,Y) stored in the Red-Green channels.  Next, you compute a distance field on the GPU using erosion, placing distance in the Blue channel and carrying along (X,Y) for the ride.  After you've performed erosion for the desired number of iterations, you can instantly find the nearest (X,Y) for any point in the viewport.

Here's a screenshot of the offscreen buffer used for instantaneous lookup.  I stopped erosion about 50 iterations.

![DistancePicking Map]({{ BASE_PATH }}/assets/thumbnails/DistanceField-halved.png)

The resultant distance field can also be used for additional effects, such as silhouetting or antialiasing.  You could also carry along an object id instead of (X,Y) coordinates, allowing you to pick an object rather than a point.

### Naive Approach: Manhattan Distance

The easiest way to generate a distance field on the GPU is to ping-pong between two framebuffer objects, blitting a full-screen quad at each iteration.  The fragment shader gradually spreads a "grassfire" by taking the minimum of the surrounding 4 pixels and incrementing the result.

The problem with this approach is that it generates Manhattan distance (left) rather than Euclidean distance (right):

![DistancePicking Map]({{ BASE_PATH }}/assets/figures/ThreePixels.png)

### Better: Squared Euclidean Distance

Generating a field of squared Euclidean distances can be done by making a series of horizontal passes, followed by a series of vertical passes.

As with grassfire, you ping-pong between two FBO's, shown as **A** and **B** in the diagram below.  However, instead of always adding 1, you add an odd integer (**β**) that increases at each step.

In the following diagram, the seed image is shown in the upper-left corner; the final distance field is shown in the lower-right corner.

[![Distance Field]({{ ASSET_PATH }}/figures/ErosionDiagram.png)]({{ ASSET_PATH }}/figures/ErosionDiagram.svg)

### OpenGL Demo

My demo code is posted on github for your enjoyment:

{% assign GITHUB_PATH = 'https://github.com/prideout/recipes/blob/master' %}

*   [DistancePicking.c]({{GITHUB_PATH}}/demo-DistancePicking.c)
*   [DistancePicking.glsl]({{GITHUB_PATH}}/demo-DistancePicking.glsl)

By the way, I wouldn't recommend this for generating distance fields on the CPU.  In the area of CPU-amenable algorithms, Saito-Toriwaki is probably my favorite, although the Danielsson method is more classic.