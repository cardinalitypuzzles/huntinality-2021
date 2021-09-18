// resize puzzle display so no scrolling needed
$(window).on("load", resizeDisplay);
$(window).on("resize", resizeDisplay);

function resizeDisplay() {
    let screen = $(window).height() - $("nav").height() - 10;
    let scale = screen / $("#puzzle-display").height();
    if (scale < 1.0) {
        $("#puzzle-display").css({
            "transform": "scale(" + scale + ")",
            "transform-origin": "top center"
        });
    } else {
        $("#puzzle-display").css({
            transform: ""
        });
    }
}


var timeout;

$(document).ready(function() {
    $("#round-2 div.puzzle-display-story").hover(
        function() {
            $(this).get(0).animate(
                { transform: "scale(1.25)", offset: 0.5 },
                {
                    duration: 150,
                    iterations: 1,
                    easing: "linear",
                    direction: "alternate"
                }
            )
        }
    );

    $("#round-2 svg.feeder-puzzle-image .hitbox").hover(
        function() {
            $(this).closest("svg").get(0).animate(
                { transform: "scale(1.25)", offset: 0.5 },
                {
                    duration: 150,
                    iterations: 1,
                    easing: "linear",
                    direction: "alternate"
                }
            )
            timeout = setTimeout(showR2PuzzleInfo.bind(this), 100);
        }, function() {
            clearTimeout(timeout);
        }
    );

    $("#round-2 svg.meta-puzzle-image .hitbox").hover(
        function() {
            $(this).closest("svg").get(0).animate(
                { transform: "scale(1.1)", offset: 0.5 },
                {
                    duration: 150,
                    iterations: 1,
                    easing: "linear",
                    direction: "alternate",
                }
            )
            timeout = setTimeout(showR2PuzzleInfo.bind(this), 100);
        }, function() {
            clearTimeout(timeout);
        }
    );
});


function showR2PuzzleInfo() {
    // remove active from all feeder and meta images
    $("#round-2 svg.feeder-puzzle-image, #round-2 svg.meta-puzzle-image").removeClass("active");

    // add active to parent of hovered
    let svg_parent = $(this).closest("svg")
    svg_parent.addClass("active");
    let answer = svg_parent.data("puzzle-answer")
    if (answer.length > 0) {
        answer_text = `A: ${answer}`;
    } else {
        answer_text = "";
    }
    $("#round-2 .puzzle-display-text-1").html(`
    <svg viewBox="0 0 400 200" class="position-absolute">
        <foreignObject x="0" y="10" width="100%" height="100%" class="text-white">
            <p class="puzzle_name my-1 fs-1">${svg_parent.data("puzzle-name")}</p>
            <p class="fs-5">${answer_text}</p>
        </foreignObject>
    </svg>`);

    let story = svg_parent.data("puzzle-story")
    if (story.length > 0) {
        story_text = `<a href="${story}">Read Story</a>`;
    } else {
        story_text = "Story Locked";
    }

    $("#round-2 .puzzle-display-text-2").html(`
    <svg viewBox="0 0 350 200" class="position-absolute">
        <foreignObject x="0" y="10" width="70%" height="100%" class="text-white">
            <p class="my-1 fs-1">${story_text}</p>
        </foreignObject>
    </svg>`);
}




