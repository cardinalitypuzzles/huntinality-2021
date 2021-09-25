function normalize_puzzle_answer(answer) {
    return answer.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function answer_checker_fn(right_answer, partials, char_name) {
    return () => {
        form = document.getElementsByClassName("form-inline")[0]
        form.onsubmit = () => {
            answer = normalize_puzzle_answer(document.getElementById("id_answer").value)

            // Remove solved panel if it exists
            if (document.contains(document.getElementById("solved-panel"))) {
                document.getElementById("solved-panel").remove();
            }

            // Create new solved panel
            node = document.createElement("div")
            node.setAttribute("id", "solved-panel")
            if (answer == right_answer) {
                node.setAttribute("class", "solved-panel")
                node.innerHTML = "<h4>Solved!</h4>\n<p>The answer was <b>" + right_answer + "</b>."
                if (char_name) {
                    node.innerHTML += "</p>\n<p><i>" + char_name + " has joined the battle!</i></p>"
                }
            } else if (answer in partials) {
                node.setAttribute("class", "unsolved-panel")
                node.innerHTML = "<h4>Incorrect!</h4>\n<div class='alert alert-block alert-danger'> <ul class='m-0'> <li>" + partials[answer] + "</li> </ul> </div>"
            } else {
                node.setAttribute("class", "unsolved-panel")
                node.innerHTML = "<h4>Incorrect!</h4>"
            }

            // Inject it
            form.parentNode.insertBefore(node, form)

            // Return false to prevent GET request from executing
            return false;
        }
    }
}