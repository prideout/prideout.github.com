// Create a COMMON namespace for a small handful of helper functions
// and properties.
var COMMON = {cdn: "http://ajax.googleapis.com/ajax/libs/"};

// Use HeadJS to load scripts asynchronously, but execute them
// synchronously.  After we have a build process in place, we'll
// replace the following source list with a single minified file.
head.js(
  "lib/showdown.js",
  COMMON.cdn + "jquery/1.8.0/jquery.min.js",
  COMMON.cdn + "jqueryui/1.9.2/jquery-ui.min.js");

// After all scripts have been loaded AND after the document is
// "Ready", do this:
head.ready(function() {

  // Execute the recipe's main() function
  main();

});
