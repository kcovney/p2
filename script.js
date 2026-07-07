const VALID_LETTERS = ["a", "b", "c", "d", "e", "f"];
const VALID_NUMBERS = ["1", "2", "3", "4", "5"];
const FIRST_BOX = "a1";
const LAST_BOX = "f5";
const FIRST_ROW = "row_a";
const LAST_ROW = "row_f";
const WORDLIST_PATH = "wordlists/wordlist_short.txt";
const WORD_LENGTH = 5;
const HIGHLIGHT_COLOR = "#500000";
const HARD_MATCH_COLOR = "#538D4E";
const SOFT_MATCH_COLOR = "#B59F3B";
const NO_MATCH_COLOR = "#3A3A3B";
const BACKGROUND_COLOR = "#121214";

let game_over = false;
let target_word;
let word_set = new Set();
let selected_box = document.getElementById(FIRST_BOX);
let selected_row = document.getElementById(FIRST_ROW);
let alert_timer_id = null;
let num_matches = 0;

selected_box.focus();
load_words();
highlight_box();
add_event_listeners();

function add_event_listeners() {
    const guess_box_inputs = document.querySelectorAll(".guess_box_input");
    guess_box_inputs.forEach(box => {
        box.addEventListener("keydown", handle_keydown);
        box.addEventListener("input", (event) => {
            handle_input(event);
        });
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
        if ((event.target.id[1] === "5" && selected_box.value !== "") || event.target.id[1] === "1") {
            selected_box.value = "";
        }
        else {
            move_cursor_backward();
            selected_box.value = "";
        }
    }
    else if (event.key === "Enter") {
        const guess_word = Array.from(selected_row.children).map(box => box.children[0].children[0].value).filter(l => l !== "");
        if (guess_word.length !== WORD_LENGTH) {
            show_alert("Not enough letters");
        }
        else if (!check_word(guess_word)) {
            show_alert("Not in word list");
        }
        else {
            handle_valid_guess(guess_word);
        }
    }
}

function get_target_word() {
    // const words_array = [...word_set];
    // return words_array[Math.floor(Math.random() * words_array.length)];
    return ["b", "e", "f", "i", "t"];
}

function handle_valid_guess(word) {
    const temp_target_word = [...target_word];
    const box_colors = [null, null, null, null, null];
    const row = Array.from(selected_row.children).map(box => box.children[0].children[0]);
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (word[i] === temp_target_word[i]) {
            row[i].style.backgroundColor = HARD_MATCH_COLOR;
            box_colors[i] = HARD_MATCH_COLOR;
            temp_target_word[i] = "";
        }
    }
    if (word.every((letter, index) => letter === target_word[index])) {
        game_over = true;
        handle_win("You win!");
        return;
    }
    for (let i = 0; i < WORD_LENGTH - 1; i++) {
        for (let j = i + 1; j < WORD_LENGTH; j++) {
            if (word[i] === temp_target_word[j]) {
                row[i].style.backgroundColor = SOFT_MATCH_COLOR;
                box_colors[i] = SOFT_MATCH_COLOR;
                temp_target_word[j] = "";
                break;
            }
        }
    }
    temp_target_word.forEach((letter, index) => {
        if (!box_colors[index]) {
            row[index].style.backgroundColor = NO_MATCH_COLOR;
        }
    });
    selected_row = document.getElementById(next_row_id(selected_row.id));
    selected_box = document.getElementById(next_box_id(selected_box.id));
    selected_box.focus();
    highlight_box();
}

function handle_win(message) {
    const game_over_box = document.getElementById("game_over_box");
    alert_message.textContent = message;
    alert_box.classList.remove("hidden");
}

function next_row_id(row_id_string) {
    if (row_id_string === "row_f") {
        return "row_f";
    }
    return "row_" + VALID_LETTERS[VALID_LETTERS.indexOf(row_id_string[row_id_string.length - 1]) + 1];
}

async function load_words() {
    const response = await fetch(WORDLIST_PATH);
    const text = await response.text();
    word_set = new Set(text.split("\n").map(word => word.trim().toLowerCase()));
    target_word = get_target_word();
}

function check_word(word) {
    return word_set.has(word.join(""));
}

function valid_letter_guess(event) {
    return is_alpha(event) && event.key.length === 1;
}

function is_alpha(event) {
    return /[a-zA-Z]/.test(event.key);
}

function handle_input(event) {
    if (event.target.id[1] !== "5") {
        move_cursor_forward();
    }
}


function move_cursor_forward() {
    curr_box_id = selected_box.id;
    if (curr_box_id !== "f5") {
        dehighlight_box();
        selected_box = document.getElementById(next_box_id(curr_box_id));
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

    if (box_id_string === "a1") {
        return "a1"
    }
    const letter = box_id_string[0];
    const digit = parseInt(box_id_string[1], 10);

    if (digit === 1) {
        return VALID_LETTERS[VALID_LETTERS.indexOf(letter) - 1] + "5";
    }
    return letter + String(digit - 1);
}

function next_box_id(box_id_string) {
    validate_box_id_string(box_id_string);

    if (box_id_string === "f5") {
        return "f5"
    }
    const letter = box_id_string[0];
    const digit = parseInt(box_id_string[1], 10);

    if (digit === WORD_LENGTH) {
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
    selected_box.style.backgroundColor = HIGHLIGHT_COLOR;
}

function dehighlight_box() {
    selected_box.style.backgroundColor = BACKGROUND_COLOR;
}

function show_alert(message, timeout=1500) {
    const alert_box = document.getElementById("alert_box");
    if (alert_timer_id) {
        clearTimeout(alert_timer_id);
    }
    alert_message.textContent = message;
    alert_box.classList.remove("hidden");

    alert_timer_id = setTimeout(() => {
        alert_box.classList.add("hidden");
    }, timeout);
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

    console.assert(next_row_id("row_a") === "row_b");
    console.assert(next_row_id("row_b") === "row_c");
    console.assert(next_row_id("row_c") === "row_d");
    console.assert(next_row_id("row_d") === "row_e");
    console.assert(next_row_id("row_e") === "row_f");
    console.assert(next_row_id("row_f") === "row_f");
}
// test();

/*
box layout: 

a1 a2 a3 a4 a5
b1 b2 b3 b4 b5
c1 c2 c3 c4 c5
d1 d2 d3 d4 d5
e1 e2 e3 e4 e5
f1 f2 f3 f4 f5

*/