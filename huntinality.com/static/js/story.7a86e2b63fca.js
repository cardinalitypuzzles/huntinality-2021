$(document).ready(function() {
    var hash = location.hash.replace(/^#/, '');
    if (hash) {
        $('.nav-tabs button[id="' + hash + '"]').tab('show');
    }
});
