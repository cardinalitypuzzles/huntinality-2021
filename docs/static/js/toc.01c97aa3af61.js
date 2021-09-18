$(function() {
  var navSelector = "#toc";
  var $myNav = $(navSelector);
  Toc.init($myNav);
  $("body").scrollspy({
    target: navSelector,
    offset: 130
  });
});
