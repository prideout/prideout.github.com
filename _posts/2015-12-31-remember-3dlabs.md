---
layout: modern
tags : [personal]
description : "Reminiscing about my corporate alma mater."
thumbnail : glsldemo-masked.png
title: Remember 3Dlabs?
---
{% include JB/setup %}

# Remember 3Dlabs?

3Dlabs was a cool little UK-based company.  It was founded in 1994 when Osman Kent left DuPont Pixel, but I came to it in 2000 when it absorbed Intense3D, a spinoff from Intergraph.

<div style="width:250px;height:250px;position:relative;display:inline-block">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas class="nice-image"  style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="mycanvas" >
    </canvas>
</div>
<i>Quick-and-dirty WebGL imitation of our old "glsldemo" app.</i>

For the most part, I was located at the Colorado office, working on a small piece of the world's first GLSL compiler.

<img src="{{ ASSET_PATH }}/downtown.jpg" class="nice-image" style="width:95%;max-width:512px">

<i>Our office was on the second floor in Fort Collins Old Town Square.</i>

I loved my job: the location, the innovative things we were doing, and the bright people.  I spent a few weeks at the UK mothership, and have very fond memories of that trip.

I also worked for 3Dlabs in their Alabama office on the driver team, where I fixed bugs in C and microcode.  I'm thankful that my career started so close to the metal, even though I didn't appreciate it at the time.  It had a lasting positive influence on the way I approach software development.

***Software is not a platform.  The hardware is the platform. (Mike Acton)***

<i>
Philip Rideout
<br>
December 2015
</i>

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/klein.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    new PargApp('#mycanvas', 'play', baseurl, true);
</script>

