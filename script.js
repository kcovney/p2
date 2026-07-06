const VALID_LETTERS = ["a", "b", "c", "d", "e", "f"];
const VALID_NUMBERS = ["1", "2", "3", "4", "5"];
const FIRST_BOX = "a1";
const LAST_BOX = "f5";
const FIRST_ROW = "row_a";
const LAST_ROW = "row_f";
let selected_box = document.getElementById(FIRST_BOX);
let selected_row = document.getElementById(FIRST_ROW);
selected_box.focus();
highlight_box();
add_event_listeners();

function add_event_listeners() {
    const guess_box_inputs = document.querySelectorAll(".guess_box_input");
    guess_box_inputs.forEach(box => {
        box.addEventListener("keydown", handle_keydown);
        box.addEventListener("input", move_cursor_forward);
        box.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });
    });
    window.addEventListener("click", () => {
        selected_box.focus();
        highlight_box();
    });
}

function handle_keydown(event) {
    if (!valid_letter_guess(event)) {
        event.preventDefault();
    }
    if (event.key === "Backspace" || event.key === "Delete") {
        if (event.repeat) {
            return;
        }
        if (selected_box.id === LAST_BOX && selected_box.value !== "") {
            selected_box.value = "";
        }
        else {
            move_cursor_backward();
            selected_box.value = "";
        }
    }
    else if (event.key === "Enter") {
        const row = Array.from(selected_row.children);
        const word = row.map(box => box.children[0].children[0].value).filter(l => l !== "");
        if (word.length !== 5) {
            
        }
    }
}

function valid_letter_guess(event) {
    return is_alpha(event) && event.key.length === 1;
}

function is_alpha(event) {
    return /[a-zA-Z]/.test(event.key);
}


function move_cursor_forward() {
    curr_box_id = selected_box.id;
    if (curr_box_id !== "f5") {
        dehighlight_box()
        selected_box = document.getElementById(next_box_id(curr_box_id))
        selected_box.focus();
        highlight_box();
    }
}

function move_cursor_backward() {
    curr_box_id = selected_box.id;
    if (curr_box_id !== FIRST_BOX) {
        dehighlight_box()
        selected_box = document.getElementById(prev_box_id(curr_box_id))
        selected_box.focus();
        highlight_box();
    }
}

function prev_box_id(box_id_string) {
    validate_box_id_string(box_id_string, "backward");

    const letter = box_id_string[0];
    const digit = parseInt(box_id_string[1], 10);

    if (digit === 1) {
        return VALID_LETTERS[VALID_LETTERS.indexOf(letter) - 1] + "5";
    }
    return letter + String(digit - 1);
}

function next_box_id(box_id_string) {
    validate_box_id_string(box_id_string);

    const letter = box_id_string[0];
    const digit = parseInt(box_id_string[1], 10);

    if (digit === 5) {
        return VALID_LETTERS[VALID_LETTERS.indexOf(letter) + 1] + "1";
    }
    return letter + String(digit + 1);
}

function validate_box_id_string(box_id_string, direction="forward") {
    if (!(box_id_string.length === 2 && 
          VALID_LETTERS.includes(box_id_string[0]) && 
          VALID_NUMBERS.includes(box_id_string[1]))) {
        throw new Error("ID of box was invalid, something went wrong");
    }
}

function highlight_box() {
    selected_box.style.backgroundColor = "maroon";
}

function dehighlight_box() {
    selected_box.style.backgroundColor = "#121214";
}

function test() {
    console.assert(next_box_id("a1") === "a2");
    console.assert(next_box_id("a2") === "a3");
    console.assert(next_box_id("a3") === "a4");
    console.assert(next_box_id("a4") === "a5");
    console.assert(next_box_id("a5") === "b1");

    console.assert(next_box_id("b1") === "b2");
    console.assert(next_box_id("b2") === "b3");
    console.assert(next_box_id("b3") === "b4");
    console.assert(next_box_id("b4") === "b5");
    console.assert(next_box_id("b5") === "c1");

    console.assert(next_box_id("c1") === "c2");
    console.assert(next_box_id("c2") === "c3");
    console.assert(next_box_id("c3") === "c4");
    console.assert(next_box_id("c4") === "c5");
    console.assert(next_box_id("c5") === "d1");

    console.assert(next_box_id("d1") === "d2");
    console.assert(next_box_id("d2") === "d3");
    console.assert(next_box_id("d3") === "d4");
    console.assert(next_box_id("d4") === "d5");
    console.assert(next_box_id("d5") === "e1");

    console.assert(next_box_id("e1") === "e2");
    console.assert(next_box_id("e2") === "e3");
    console.assert(next_box_id("e3") === "e4");
    console.assert(next_box_id("e4") === "e5");
    console.assert(next_box_id("e5") === "f1");

    console.assert(next_box_id("f1") === "f2");
    console.assert(next_box_id("f2") === "f3");
    console.assert(next_box_id("f3") === "f4");
    console.assert(next_box_id("f4") === "f5");

    console.assert(prev_box_id("a2") === "a1");
    console.assert(prev_box_id("a3") === "a2");
    console.assert(prev_box_id("a4") === "a3");
    console.assert(prev_box_id("a5") === "a4");

    console.assert(prev_box_id("b1") === "a5");
    console.assert(prev_box_id("b2") === "b1");
    console.assert(prev_box_id("b3") === "b2");
    console.assert(prev_box_id("b4") === "b3");
    console.assert(prev_box_id("b5") === "b4");

    console.assert(prev_box_id("c1") === "b5");
    console.assert(prev_box_id("c2") === "c1");
    console.assert(prev_box_id("c3") === "c2");
    console.assert(prev_box_id("c4") === "c3");
    console.assert(prev_box_id("c5") === "c4");

    console.assert(prev_box_id("d1") === "c5");
    console.assert(prev_box_id("d2") === "d1");
    console.assert(prev_box_id("d3") === "d2");
    console.assert(prev_box_id("d4") === "d3");
    console.assert(prev_box_id("d5") === "d4");

    console.assert(prev_box_id("e1") === "d5");
    console.assert(prev_box_id("e2") === "e1");
    console.assert(prev_box_id("e3") === "e2");
    console.assert(prev_box_id("e4") === "e3");
    console.assert(prev_box_id("e5") === "e4");

    console.assert(prev_box_id("f1") === "e5");
    console.assert(prev_box_id("f2") === "f1");
    console.assert(prev_box_id("f3") === "f2");
    console.assert(prev_box_id("f4") === "f3");
    console.assert(prev_box_id("f5") === "f4");
}
test();

/*
box layout: 

a1 a2 a3 a4 a5
b1 b2 b3 b4 b5
c1 c2 c3 c4 c5
d1 d2 d3 d4 d5
e1 e2 e3 e4 e5
f1 f2 f3 f4 f5

box input logic:

- first box is selected on page load
- if user types a letter in one of the first 4 boxes of a row, 
focus moves to the next box of that row
- typing in the last letter of a row simply adds the letter without advancing the cursor
- if user deletes a letter in one of the last 4 boxes of a row,
focus moves to the previous box of that row
- deleting the first letter of a row simply deletes the letter without advancing the cursor
- if the user presses enter
    - if there aren't enough letters
        alert: Not enough letters
        shake row
    - else if the input isn't a valid word
        alert: Not in word list
        shake row
    - else (all 5 boxes in the row filled in and word a valid word)
        - lock in guess (animate)
        - move cursor to next row


*/