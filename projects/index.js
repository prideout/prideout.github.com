var main = function() {

  var converter = new Showdown.converter();

  var markdown = $.get('index.md', function(mdSource) {
    var html = converter.makeHtml(mdSource);
    $('#target').html(html);
  });

};
