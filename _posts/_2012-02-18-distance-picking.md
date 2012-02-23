---
layout: post
tags : [opengl]
description : "Create a distance field on the GPU, use it for point selection."
thumbnail : DistancePicking-masked.png
---
{% include JB/setup %}

![DistancePicking Screenshot]({{ BASE_PATH }}/assets/thumbnails/DistancePicking-halved.png)

This is an idea I have for using the GPU to assist in nearest point calculations.  I'm not sure how useful it is in practice, but it's one way to avoid the overhead of a spatial bounding hierarchy for simple picking operations.

The basic premise is to render your objects to an offscreen buffer with screen-space (X,Y) stored in the Red-Green channels, then compute a distance field using erosion, placing distance in the Green channel and carrying along (X,Y) for the ride.  After you've performed erosion for the desired number of iterations, you can instantly find the nearest (X,Y) for any point in the viewport.

![DistancePicking Map]({{ BASE_PATH }}/assets/thumbnails/DistancePicking-map.png)

The resultant distance field can also be used for additional effects, such as silhouetting or antialiasing.

### Naive Approach: Manhattan Distance

TBD

### Better: Horizontal-Vertical Erosion

TBD

### The Demo

TBD
