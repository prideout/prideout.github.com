
var cdn = 'http://ajax.cdnjs.com/ajax/libs';

$.getScript(cdn + '/require.js/2.1.4/require.min.js', function() {

  var gizapath = '../giza/';

  var scripts = [
    gizapath + 'Giza.js',
    gizapath + 'Utility.js',
    gizapath + 'Animation.js',
    gizapath + 'Shaders.js',
    gizapath + 'BufferView.js',
    gizapath + 'Vector.js',
    gizapath + 'Matrix.js',
    gizapath + 'Color.js',
    gizapath + 'Topo.js',
    gizapath + 'Polygon.js',
    gizapath + 'Surface.js',
    gizapath + 'Path.js',
    gizapath + 'Mouse.js',
    gizapath + 'Turntable.js',
  ];

  // In Chrome, Cmd+Shift+R will reload with cache.
  // This seems to help too.
  require.config({
    urlArgs: "bust=" + (new Date()).getTime()
  });

  require(scripts, function() {

    var gl = GIZA.init();

    init(gl);

    var wrapped = function(time) {
      draw(gl, time);
    };

    GIZA.animate(wrapped);
  });

});
