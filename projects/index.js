var main = function() {

  var mdSource = $('#content').text();
  var converter = new Showdown.converter();

  var html = converter.makeHtml(mdSource);

  $('#target').html(html);

  if (false) {
      $('img').each(function() {
        var src = $(this).attr('src');
        $(this).replaceWith(
            '<object data="' + src + '" \n'  +
            '        type="image/svg+xml">');
      });
  }

  // <object data="graphs/Figure1a.dot.svg"
  //         type="image/svg+xml"
  //         width="100%" height="100%">

  if (window.location.hash) {
    window.setTimeout(function() {
      console.info(window.location.hash);
      window.location.search = "?toc";
    }, 1000);
  }

};
