var MOVE_RESPONSES = {
    "PUNRELIABLEMASH": [
        "You clobber your opponent with a punreliable mash, dealing 12 damage.",
        "Accordion to it, these puns are so bad they should also hurt you a bit.",
        "Argh!",
        "You lose 4 hit points.",
    ],
    "SEARCHINGSTARE": [
        "You unnerve your opponent with a searching stare, dealing 14 damage.",
        "Your eyes hurt a bit from staring so intensely.",
        "Argh! Eek!",
        "You lose 3 hit points.",
    ],
    "CLUEGUARD": [
        "You put up your clue guard against your opponent as it attacks, "
        + "dealing 9 damage.",
        "The clue is that you also need to take damage, apparently.",
        "Argh! Eek! Oof!",
        "You lose 8 hit points.",
    ],
    "MINDBENDING": [
        "You bend your opponent's mind, dealing 2 damage.",
        "You must have bent it too much, as it springs back and hits you.",
        "Argh! Eek! Oof! Ooh!",
        "You lose 9 hit points.",
    ],
    "MENTALACUMIN": [
        "You show off your spicy mental acumin to your opponent, dealing 9 damage.",
        "The spiciness overwhelms your own brain a little.",
        "Argh! Eek! Oof! Ooh! Ouch!",
        "You lose 4 hit points.",
    ],
    "EYEOFTHEMAGE": [
        "You use your eye of the mage to envision your opponent in pain, "
        + "dealing 9 damage.",
        "It's not a pretty picture, however, which does some da of the mage to you.",
        "Argh! Eek! Oof! Ooh! Ouch! Ow!",
        "You lose 2 hit points.",
    ],
    "MEDIUMRARITY": [
        "This isn't a move, it's the answer!",
        "Put it in the puzzle's answer checker.",
        "",
        "",
    ],
}
function move_checker_fn() {
    return () => {
        $("#move_form").on("submit", function(event){
            event.preventDefault();
            $("#move_response").removeClass()
            $("#move_response").empty()
            move = normalize_puzzle_answer($(this).serializeArray()[0]["value"])
            if (move in MOVE_RESPONSES) {
                response = MOVE_RESPONSES[move]
                $("#move_response").append(`<div>${response[0]}</div>`)
                $("#move_response").append(`<div>${response[1]}`)
                if (response[2].length > 0) {
                  $("#move_response").append(`<div class="monster_cries">${response[2]}</div></div>`)
                }
                if (response[3].length > 0) {
                  $("#move_response").append(`<div><img src="../static/puzzle_resources/wahgyu_stakes/hp.1134c984e497.gif" class="rem2"></img>${response[3]}</div>`)
                }
            } else {
                $("#move_response").append(`<div class="text-danger">The puzzle monster doesn't know how to react to that move.<br>
                If only you had classy friends who could teach you a move... or six</div>`)
            }
        });
    }
}