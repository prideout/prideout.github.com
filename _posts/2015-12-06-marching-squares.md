---
layout: page
tags : [graphics]
description : "My single-file C library for generating triangles from images."
thumbnail : Marching-masked.png
---
{% include JB/setup %}

<img src="{{ ASSET_PATH }}/figures/MarchingTriptych.png" class="nice-image tri-image">

### Marching Squares

In this post I'll walk through some features in the [par_msquares.h](https://github.com/prideout/par/blob/master/par_msquares.h) library.  The API has two imperative functions:

{% highlight c %}
par_msquares_meshlist* par_msquares_from_grayscale(float const* data, int width,
    int height, int cellsize, float threshold, int flags);

par_msquares_meshlist* par_msquares_from_color(uint8_t const* data, int width,
    int height, int cellsize, uint32_t color, int bpp, int flags);
{% endhighlight %}

Both of these functions consume a packed array of image data and produce one or triangle meshes.  The `from_grayscale` function consumes floating-point data (one 32-bit float per pixel), while the `from_color` function consumes color data (one to four bytes per pixel).

The library also proffers a lower-level function that takes a callback function instead of image data, but the above two entry points are the easiest way to get your feet wet.

The returned mesh list pointer is opaque, but clients can peek at read-only mesh structures by passing the list into a query function:

{% highlight c %}
par_msquares_mesh const* par_msquares_get_mesh(par_msquares_meshlist*, int n);

int par_msquares_get_count(par_msquares_meshlist*);

typedef struct {
    float* points;        // pointer to XY (or XYZ) vertex coordinates
    int npoints;          // number of vertex coordinates
    uint16_t* triangles;  // pointer to 3-tuples of vertex indices
    int ntriangles;       // number of 3-tuples
    int dim;              // number of floats per point (either 2 or 3)
} par_msquares_mesh;
{% endhighlight %}

When the client is done consuming all the data, it can free all meshes in one fell swoop:

    void par_msquares_free(par_msquares_meshlist*);

#### Flags with Grayscale Source

This section is a visual walkthrough of the `flags` argument, which takes a bitfield that can be configured in many different ways.

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

----

The DUAL flag causes the returned meshlist to have two entries instead of one.  The two meshes are disjoint; the boundary verts of each mesh are perfectly colocated.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_DUAL);

<img src="{{ ASSET_PATH }}/figures/GRAY_DUAL.png" class="figure">

----

The HEIGHTS flag generates a Z value at each vert by sampling from the nearest pixel in the source image.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_HEIGHTS);

<img src="{{ ASSET_PATH }}/figures/GRAY_HEIGHTS.png" class="figure">

---

When the HEIGHTS flag is combined with the SNAP flag, a step function is applied to the Z values such that the number of steps is equal to the number of meshes in the generated mesh list.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_DUAL | PAR_MSQUARES_HEIGHTS | PAR_MSQUARES_SNAP);

<img src="{{ ASSET_PATH }}/figures/GRAY_DHS.png" class="figure">

---

The CONNECT flag adds triangles that connect the disjoint verts along the boundary.

    mlist = par_msquares_from_grayscale(graydata, width, height, cellsize, thresh, PAR_MSQUARES_DUAL | PAR_MSQUARES_HEIGHTS | PAR_MSQUARES_SNAP | PAR_MSQUARES_CONNECT);

<img src="{{ ASSET_PATH }}/figures/GRAY_DHSC.png" class="figure">

#### Color Source Images

Grayscale images use a threshold value to determine insideness, but color images use a simple color selector.  For example, suppose we have an RGBA image that looks like this:

<img src="{{ ASSET_PATH }}/figures/COLOR_SOURCE.png" class="figure">

The semitransparent pixels on the outside of the island have an ARGB value of 0x214562, so we can invoke marching squares like this:

    mlist = par_msquares_from_color(rgbadata, width, height, cellsize, 0x214562, 4, 0);

<img src="{{ ASSET_PATH }}/figures/COLOR_DEFAULT.png" class="figure">

---

Let's try combining INVERT and HEIGHTS.  The alpha values in the source image are wired into the resulting Z values.

    mlist = par_msquares_from_color(rgbadata, width, height, cellsize, 0x214562, 4, PAR_MSQUARES_INVERT | PAR_MSQUARES_HEIGHTS);

<img src="{{ ASSET_PATH }}/figures/COLOR_IH.png" class="figure">

---

Last but not least, let's try combining a ton of flags.

    mlist = par_msquares_from_color(rgbadata, width, height, cellsize, 0x214562, 4, PAR_MSQUARES_DUAL | PAR_MSQUARES_HEIGHTS | PAR_MSQUARES_SNAP | PAR_MSQUARES_CONNECT | PAR_MSQUARES_SIMPLIFY | PAR_MSQUARES_INVERT);

<img src="{{ ASSET_PATH }}/figures/COLOR_DHSCSI.png" class="figure">


#### Footnote

C is my favorite language nowadays, especially the C99 and C11 variants.  I try not to be stubborn about it -- it's obviously not the best choice in many situations.  But, I definitely enjoy working with it more than any other language.

<!--C makes feel close to the hardware, as though I'm gardening by digging soil with my bare hands.  It brings me peace.-->

Inspired by Sean Barrett's sweet [stb](https://github.com/nothings/stb) libraries, I've started to create my own little collection of single-header libraries, and that's where the msquares library lives:

#### [https://github.com/prideout/par](https://github.com/prideout/par)
