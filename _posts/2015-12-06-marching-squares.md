---
layout: page
tags : [graphics]
description : "My single-file C library for generating triangles from images."
thumbnail : Marching-masked.png
---
{% include JB/setup %}

<img src="{{ ASSET_PATH }}/figures/MarchingTriptych.png" class="nice-image tri-image">

### Marching Cubes

In this post I'll walk through some features in my highly-configurable [par_msquares.h](https://github.com/prideout/par/blob/master/par_msquares.h) library.  The API has two primary imperative functions:

    par_msquares_meshlist* par_msquares_from_grayscale(float const* data, int width,
        int height, int cellsize, float threshold, int flags);

    par_msquares_meshlist* par_msquares_from_color(uint8_t const* data, int width,
        int height, int cellsize, uint32_t color, int bpp, int flags);

Both of these functions consume a packed array of image data and produce one or triangle meshes.  The `from_grayscale` function consumes floating-point data (one 32-bit float per pixel), while the `from_color` function consumes color data (one to four bytes per pixel).

The library also proffers a lower-level function that takes a callback function instead of image data, but the above two entry points are the easiest way to get your feet wet.

Clients can access the results of the operation by peeking inside the returned structs:

    typedef struct {
        float* points;        // pointer to XY (or XYZ) vertex coordinates
        int npoints;          // number of vertex coordinates
        uint16_t* triangles;  // pointer to 3-tuples of vertex indices
        int ntriangles;       // number of 3-tuples
        int dim;              // number of floats per point (either 2 or 3)
    } par_msquares_mesh;

    par_msquares_mesh* par_msquares_get_mesh(par_msquares_meshlist*, int n);

    int par_msquares_get_count(par_msquares_meshlist*);

When the client is done consuming all the mesh data, it can free it up:

    void par_msquares_free(par_msquares_meshlist*);

#### Flags with Grayscale Source

The marching squares operation can be configured using many flags that can be combined in various ways.

For starters, let's say your source data is a grayscale image that looks like this.

<img src="{{ ASSET_PATH }}/figures/GRAY_SOURCE.png" class="figure">

---

The simplest thing to do is to use the default behavior.  Pass 0 for the flags argument, pick a threshold, and pick a cell size.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, 0);

<img src="{{ ASSET_PATH }}/figures/GRAY_DEFAULT.png" class="figure">

---

The INVERT flag does what it sounds like.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_INVERT);

<img src="{{ ASSET_PATH }}/figures/GRAY_INVERT.png" class="figure">

---

The SIMPLIFY flag performs some really basic simplification with no loss to the quality of the boundary.  It won't produce the simplest possible mesh, but it's fast and simple.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_SIMPLIFY);

<img src="{{ ASSET_PATH }}/figures/GRAY_SIMPLIFY.png" class="figure">

#### Footnote

C is my favorite language nowadays, especially the C99 and C11 variants.  I try not to be stubborn about it -- it's obviously not the best choice in many situations.  But, I definitely enjoy working with it more than any other language.

<!--C makes feel close to the hardware, as though I'm gardening by digging soil with my bare hands.  It brings me peace.-->

Inspired by Sean Barrett's sweet [stb](https://github.com/nothings/stb) libraries, I've started to create my own little collection of single-header libraries, and that's where the msquares library lives:

#### [https://github.com/prideout/par](https://github.com/prideout/par)

<i>
Philip Rideout
<br>
December 2015
</i>

---

<i style="font-size:8px">Coffee should be hot as hell, black as the devil, pure as an angel, sweet as love.</i>
