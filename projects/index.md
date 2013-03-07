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

- [Blog](http://github.prideout.net/)
- [Github](https://github.com/prideout?tab=repositories)
- [Giza @ nodejitsu](http://giza.nodejitsu.com/)
- [Gists](https://gist.github.com/prideout)
- [SO for WebGL and ES](http://stackoverflow.com/questions/tagged/webgl%20or%20opengl-es)
- [SO for Meteor](http://stackoverflow.com/questions/tagged/meteor)

# Tetrita Notes

<style>
  stop.begin { stop-color: yellow; }
  stop.end   { stop-color:  green; }
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

## Overview

5 tiles, 7 pieces, 20 rows, 10 columns

## Tile Byte

### Low Nibble

http://www.clker.com/cliparts/E/i/W/j/3/t/blue-button.svg

http://www.clker.com/cliparts/T/R/T/d/j/C/small-button-pressed.svg

<span class="label">0</span>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
  viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  <linearGradient id="gradient">
    <stop class="begin" offset="0%"/>
    <stop class="end" offset="100%"/>
  </linearGradient>
  <rect x="0" y="0" width="100" height="100" style="fill:url(#gradient)" />
  <circle cx="50" cy="50" r="30" style="fill:url(#gradient)" />
</svg>

<span class="label">1</span>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
  viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  <linearGradient id="gradient">
    <stop class="begin" offset="0%"/>
    <stop class="end" offset="100%"/>
  </linearGradient>
  <rect x="0" y="0" width="100" height="100" style="fill:url(#gradient)" />
  <circle cx="50" cy="50" r="30" style="fill:url(#gradient)" />
</svg>

### High Nibble

(x & 0x3) == 0   0 ccw
(x & 0x3) == 1  90 ccw
(x & 0x3) == 2 180 ccw
(x & 0x3) == 3 270 ccw
(x & 0x4)      horizontal flip
(x & 0x8)      vertical flip

## Piece Definition (16 tile bytes)
