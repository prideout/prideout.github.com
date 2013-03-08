
# Projects

- Taxes, Find Tetrita notes
- Book and Giza
  - Chapter 2 verbiage
- mserve
  - click prims away, snap 'em back, hover for info
  - leaning towards meteor instead of derby
  - site's technology stack:
     - yes to jquery and jqueryui
     - no to twitter bootstrap
     - yes to ipad layout  http://stevesanderson.github.com/fixed-height-layouts-demo/two-columns.html
     - yes to google fonts
     - yes to CDN for everything except requirejs
     - yes to RequireJS
     - yes to GIZA submodule
     - derby or meteor
  - aval/bin/mserve -- upload.py (uses pymongo) and populate.py (calls out to SdtUtil.Subdivider)
  - Giza need to be publicized
- Blog Entry on Quad Meshes
  - sandbox/QuadMesh on the Sony?
  - ivec3 -> ivec4 where w is a bitset for sharpness (punt porting the Gizmo shape, carrying creases through OSD)
  - cone shape would be a per-vertex sharpness
  - Verbiage
- Beautiful Giza Docs / Commission the CSS + Logo
- demoscene (Dr Who) -- uses dancer.js
- Osd
  - Python adapter creates, tags, edits
  - Python ri-like API for Subdivs
  - port the Gizmo shape
  - file format
  - alembic interop
  - GL spec / impl
- **WebPelt** TopoJSON meets uvlayout
- SketchUp clone for Web
- Cuboid clone for Web

# Links

- [Blog](http://github.prideout.net/), [WebGL Extensions](http://prideout.net/recipes/ExtensionViewer.html)
- [Github](https://github.com/prideout?tab=repositories)
- [Giza @ nodejitsu](http://giza.nodejitsu.com/)
- [Gists](https://gist.github.com/prideout)
- [SO for WebGL and ES](http://stackoverflow.com/questions/tagged/webgl%20or%20opengl-es)
- [SO for Meteor](http://stackoverflow.com/questions/tagged/meteor)

# Tetrita Notes

## Overview

5 tiles, 7 pieces, 20 rows, 10 columns

## Links

- [Pill Button 1 SVG](http://www.clker.com/cliparts/E/i/W/j/3/t/blue-button.svg)
- [Pill Button 2 SVG](http://www.clker.com/cliparts/T/R/T/d/j/C/small-button-pressed.svg)
- [SVG as Texture](https://github.com/mrdoob/three.js/issues/1317)

## Tile (Unsigned Short)

### Shape Byte

<style>
  svg {
    width:  64px;
    height: 64px;
    border: solid 1px #000;
    vertical-align: middle;
  }
  span.label {
    font-size: 50px;
    vertical-align: middle;
  }
</style>

<span class="label">0</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" style="fill:#000" />
  <circle cx="50" cy="50" r="37" style="fill:#fff" />
</svg>

<span class="label">1</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" style="fill:#000" />
  <circle cx="50" cy="50" r="37.5" style="fill:#fff" />
  <rect x="0" y="5" width="50" height="90" style="fill:#000" />
  <rect x="0" y="12.5" width="51" height="75" style="fill:#fff" />
</svg>

<span class="label">2</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" style="fill:#000" />
  <circle cx="50" cy="50" r="37.5" style="fill:#fff" />
  <rect x="0" y="5" width="50" height="90" style="fill:#000" />
  <rect x="0" y="12.5" width="51" height="100" style="fill:#fff" />
  <rect x="0" y="51" width="95" height="50" style="fill:#000" />
  <rect x="0" y="50" width="87.5" height="50" style="fill:#fff" />
</svg>

<span class="label">3</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="0" y="5" width="100" height="90" style="fill:#000" />
  <rect x="0" y="12.5" width="100" height="75" style="fill:#fff" />
</svg>

<span class="label">4</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" style="fill:#000" />
  <circle cx="50" cy="50" r="37.5" style="fill:#fff" />
  <rect x="5" y="5" width="45" height="100" style="fill:#000" />
  <rect x="0" y="5" width="50" height="90" style="fill:#000" />
  <rect x="0" y="12.5" width="51" height="75" style="fill:#fff" />
  <rect x="51" y="51" width="44" height="49" style="fill:#000" />
  <rect x="50" y="50" width="37.5" height="50" style="fill:#fff" />
  <rect x="12.5" y="15" width="40" height="100" style="fill:#fff" />
</svg>

### Orientation Byte

We'll provide a lookup table for texture coordinates.  The fragment shader can use the lookup table and modulate it with `gl_PointCoord` to obtain the correct texture coordinate.

    (x & 0x3) == 0   0 ccw
    (x & 0x3) == 1  90 ccw
    (x & 0x3) == 2 180 ccw
    (x & 0x3) == 3 270 ccw
    (x & 0x4)      horizontal flip
    (x & 0x8)      vertical flip

## Piece Definition

16 shorts for each of the 7 pieces.
