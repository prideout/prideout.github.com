var main = function() {

  var mdSource = $('#content').text();
  var converter = new Showdown.converter();

  var html = converter.makeHtml(mdSource);

  var markdown = $.get('index.md', function(data) {
    console.info('prideout ', data);
  });

  $('#target').html(html);

  if (window.location.hash) {
    window.setTimeout(function() {
      console.info(window.location.hash);
      window.location.search = "?toc";
    }, 1000);
  }

};
