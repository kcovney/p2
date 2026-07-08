const VALID_LETTERS = ["a", "b", "c", "d", "e", "f"];
const VALID_NUMBERS = ["1", "2", "3", "4", "5"];
const FIRST_BOX = "a1";
const LAST_BOX = "f5";
const FIRST_ROW = "row_a";
const LAST_ROW = "row_f";
const WORDLIST_PATH = "wordlists/wordlist_original.txt";
const WORD_LENGTH = 5;
const HIGHLIGHT_COLOR = "#500000";
const HARD_MATCH_COLOR = "#538D4E";
const SOFT_MATCH_COLOR = "#B59F3B";
const NO_MATCH_COLOR = "#3A3A3B";
const BACKGROUND_COLOR = "#121214";
const STATE_PRIORITY = { hard_match: 3, soft_match: 2, no_match: 1 };
const keyboard_container = document.querySelector("#keyboard");

let letter_states = {};
let game_over = false;
let target_word;
let word_set = new Set();
let selected_box = document.getElementById(FIRST_BOX);
let selected_row = document.getElementById(FIRST_ROW);
let alert_timer_id = null;
let num_matches = 0;
let guess_count = 0;

selected_box.focus();
load_words();
add_event_listeners();

/*
adds listeners for the game container, handling the following events:
- keydown - keyboard key was pressed
- input - a letter was entered into a guessbox
- mousedown - the user clicked the mouse
an additional window click-event listener automatically resumes current-letter 
focus when the user clicks anywhere in the window
*/
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
    });
    document.getElementById("restart_button").addEventListener("click", handle_restart);
}

// handles any physical keyboard press, allowing only letters, the backspace key, and enter
function handle_keydown(event) {
    if (!valid_letter_guess(event)) {
        event.preventDefault();
    }
    if (event.key === "Backspace" || event.key === "Delete") {
        handle_backspace_press();
    }
    else if (event.key === "Enter") {
        handle_enter_press();
    }
}

// handles when the user presses enter on a physical or virtual keyboard
function handle_enter_press() {
    // transforms user input into an array of strings (e.g. ["a", "r", "i", "s", "e"])
    const guess_word = Array.from(selected_row.children).map(box => box.children[0].children[0].value).filter(l => l !== "");
    if (guess_word.length !== WORD_LENGTH) {
        show_alert("Not enough letters");
    }
    else if (!check_word(guess_word)) {
        show_alert("Not in word list");
    }
    else {
        if (game_over) {
            return;
        }
        handle_valid_guess(guess_word);
    }
}

// handles when the user presses backspace on a physical or virtual keyboard
function handle_backspace_press() {
    if (game_over) {
        return;
    }
    if (!(selected_box.id[1] === "5" && selected_box.value !== "") && selected_box.id[1] !== "1") {
        move_cursor_backward();
    }
    selected_box.value = "";
}

// handles when the user presses a letter on the virtual keyboard
function handle_letter_press(key) {
    if (game_over) {
        return;
    }
    selected_box.value = key;
    if (selected_box.id[1] !== "5") {
        move_cursor_forward();
    }
}

/*
pulls a random word from the set of words (from a wordlist file) and returns it as an array
e.g. if the chosen word is "arise", get_target_word() returns ["a", "r", "i", "s", "e"]
*/
function get_target_word() {
    return Array.from([...word_set][Math.floor(Math.random() * [...word_set].length)]);
}

/*
handles feedback in the event that the user types in a 5 letter word, hits enter,
that word is in the wordlist, and the game hasn't ended
*/
function handle_valid_guess(word) {
    guess_count++;
    const temp_target_word = [...target_word];
    const box_colors = [null, null, null, null, null];
    const row = Array.from(selected_row.children).map(box => box.children[0].children[0]);

    // find hard matches (correct letter, correct placement)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (word[i] === temp_target_word[i]) {
            row[i].style.backgroundColor = HARD_MATCH_COLOR;
            box_colors[i] = HARD_MATCH_COLOR;
            temp_target_word[i] = "";
        }
    }
    // handle the win condition
    if (word.every((letter, index) => letter === target_word[index])) {
        word.forEach(letter => update_keyboard_state(letter, "hard_match"));
        game_over = true;
        handle_win("You win!");
        return;
    }
    // find soft matches (correct letter, incorrect placement), without overwriting hard matches
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (box_colors[i]) {
            continue;
        }
        for (let j = 0; j < WORD_LENGTH; j++) {
            if (word[i] === temp_target_word[j]) {
                row[i].style.backgroundColor = SOFT_MATCH_COLOR;
                box_colors[i] = SOFT_MATCH_COLOR;
                temp_target_word[j] = "";
                break;
            }
        }
    }
    // find non-matches (incorrect letter), without overwriting hard or soft matches
    temp_target_word.forEach((letter, index) => {
        if (!box_colors[index]) {
            row[index].style.backgroundColor = NO_MATCH_COLOR;
        }
    });
    // update the keyboard to match the game board
    word.forEach((letter, index) => {
        if (box_colors[index] === HARD_MATCH_COLOR) {
            update_keyboard_state(letter, "hard_match");
        }
        else if (box_colors[index] === SOFT_MATCH_COLOR) {
            update_keyboard_state(letter, "soft_match");
        }
        else {
            update_keyboard_state(letter, "no_match");
        }
    });
    // handle loss condition (user made 6 incorrect guesses)
    if (selected_row.id === LAST_ROW) {
        game_over = true;
        handle_loss(`The word was ${target_word.join("")}`);
        return;
    }
    // update game state
    selected_row = document.getElementById(next_row_id(selected_row.id));
    selected_box = document.getElementById(next_box_id(selected_box.id));
    selected_box.focus();
}

// color virtual keyboard according to the most recent guess
function update_keyboard_state(letter, state) {
    const current_priority = STATE_PRIORITY[letter_states[letter]] || 0;
    const new_priority = STATE_PRIORITY[state];

    if (new_priority > current_priority) {
        letter_states[letter] = state;
        keyboard.set_key_state(letter, state);
    }
}

// shows the loss popup, then records the game's guess count and displays the running average
function handle_loss(message) {
    const game_over_box = document.getElementById("game_over_box");
    update_guess_stats();
    const average = get_average_guesses();
    game_over_message.textContent = `${message} (avg guesses: ${average.toFixed(2)})`;
    game_over_box.classList.remove("hidden");
}

// show an alert that the user won
function handle_win(message) {
    const game_over_box = document.getElementById("game_over_box");
    update_guess_stats();
    const average = get_average_guesses();
    game_over_message.textContent = `${message} (avg guesses: ${average.toFixed(2)})`;
    game_over_box.classList.remove("hidden");
}

// translates a row id ("row_[a-f]") into the next row id (e.g. "row_a" => "row_b")
function next_row_id(row_id_string) {
    if (row_id_string === "row_f") {
        return "row_f";
    }
    return "row_" + VALID_LETTERS[VALID_LETTERS.indexOf(row_id_string[row_id_string.length - 1]) + 1];
}

// get the words from the wordlist, place in a set, get a target word, and print the target word to the console
async function load_words() {
    const response = await fetch(WORDLIST_PATH);
    const text = await response.text();
    word_set = new Set(text.split("\n").map(word => word.trim().toLowerCase()));
    target_word = get_target_word();
    console.log(`the word is ${target_word.join("")}`);
}

// check that the word is in the wordlist (it's a valid guess)
function check_word(word) {
    return word_set.has(word.join(""));
}

// returns true if the key that triggered an event is a valid single letter
function valid_letter_guess(event) {
    return is_alpha(event) && event.key.length === 1;
}

// returns true if the key that triggered an event is a valid letter
function is_alpha(event) {
    return /[a-zA-Z]/.test(event.key);
}

// moves the cursor to the next box, as long as it wasn't the last letter of a word
function handle_input(event) {
    if (event.target.id[1] !== "5") {
        move_cursor_forward();
    }
}

// moves the cursor to the next box, as long as it wasn't the final box (last row, last letter)
function move_cursor_forward() {
    curr_box_id = selected_box.id;
    if (curr_box_id !== "f5") {
        selected_box = document.getElementById(next_box_id(curr_box_id));
        selected_box.focus();
    }
}

// moves the cursor to the previous box for delets
function move_cursor_backward() {
    curr_box_id = selected_box.id;
    if (curr_box_id !== FIRST_BOX) {
        selected_box = document.getElementById(prev_box_id(curr_box_id))
        selected_box.focus();
    }
}

// given a box id, returns the previous box id (e.g. "a2" => "a1")
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
// given a box id, returns the next box id (e.g. "a1" => "a2")
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

// checks that a box_id_string is valid,
function validate_box_id_string(box_id_string, direction = "forward") {
    if (!(box_id_string.length === 2 &&
        VALID_LETTERS.includes(box_id_string[0]) &&
        VALID_NUMBERS.includes(box_id_string[1]))) {
        throw new Error("ID of box was invalid, something went wrong");
    }
}

// can be used to change the color of a box for accessibility or debugging
function highlight_box() {
    selected_box.style.backgroundColor = HIGHLIGHT_COLOR;
}

// can be used to change the color of a box for accessibility or debugging
function dehighlight_box() {
    selected_box.style.backgroundColor = BACKGROUND_COLOR;
}

/*
used to show an auto-disappearing message in the event the user guesses a 
word that is fewer than 5 letters, or guesses a word that is not in the wordlist
*/
function show_alert(message, timeout = 1500) {
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

// resets the game to a fresh state: new word, cleared boxes, cleared keyboard colors, hidden popup
function handle_restart() {
    game_over = false;
    letter_states = {};
    guess_count = 0;
    target_word = get_target_word();

    document.querySelectorAll(".guess_box_input").forEach(box => {
        box.value = "";
        box.style.backgroundColor = BACKGROUND_COLOR;
    });

    keyboard.reset_key_states();
    keyboard.enable();

    selected_row = document.getElementById(FIRST_ROW);
    selected_box = document.getElementById(FIRST_BOX);
    selected_box.focus();

    document.getElementById("alert_box").classList.add("hidden");
    document.getElementById("game_over_box").classList.add("hidden");
}

// writes a cookie with a given name, value, and expiration (default 1 year)
function set_cookie(name, value, days=365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

// reads a cookie by name, returning null if it doesn't exist
function get_cookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? match[1] : null;
}

// adds the current game's guess count to the running totals stored in cookies
function update_guess_stats() {
    const total_guesses = parseInt(get_cookie("total_guesses") || "0", 10) + guess_count;
    const total_games = parseInt(get_cookie("total_games") || "0", 10) + 1;

    set_cookie("total_guesses", total_guesses);
    set_cookie("total_games", total_games);
}

// calculates the average number of guesses per game across all recorded games
// returns null if no games have been recorded yet
function get_average_guesses() {
    const total_guesses = parseInt(get_cookie("total_guesses") || "0", 10);
    const total_games = parseInt(get_cookie("total_games") || "0", 10);

    if (total_games === 0) {
        return null;
    }
    return total_guesses / total_games;
}

/*
constructor for a virtual GameKeyboard with the following attributes:
container - the element to place the keyboard in
layout - a list of lists, specifying the sequence of keys
key_elements - stores virtual keyboard key html elements in a dictionary 
    (e.g. key_elements = { "q": <button data-key="q">Q</button>) }
disabled - boolean, to be used to prevent virtual keyboard input after the game ends
*/
function GameKeyboard() {
    this.container = document.querySelector("#keyboard");
    this.layout = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"]
    ];
    this.key_elements = {};
    this.disabled = false;

    if (!this.container) {
        throw new Error("GameKeyboard requires a 'container' element.");
    }
    this.render();
}

// builds the virtual keyboard on website load
GameKeyboard.prototype.render = function() {
    this.container.innerHTML = "";
    this.container.classList.add("virtual_keyboard");

    this.layout.forEach(row => {
        const row_element = document.createElement("div");
        row_element.classList.add("keyboard_row");

        row.forEach(key => {
            const key_element = document.createElement("button");
            key_element.type = "button";
            key_element.classList.add("keyboard_key");
            key_element.dataset.key = key;

            if (key === "Enter" || key === "Backspace") {
                key_element.classList.add("keyboard_key_wide");
            }
            key_element.textContent = key === "Backspace" ? "⌫" : key;

            key_element.addEventListener("click", () => {
                this.handle_key_click(key);
            });
            this.key_elements[key] = key_element;
            row_element.appendChild(key_element);
        });

        this.container.appendChild(row_element);
    });
}

// handles when the user clicks a key
GameKeyboard.prototype.handle_key_click = function(key) {
    if (this.disabled) {
        return;
    }
    this.onKeyPress(key);
}

// looks up a key by letter and updates its match-state class (hard_match, soft_match, no_match)
GameKeyboard.prototype.set_key_state = function(letter, state) {
    const key_element = this.key_elements[letter.toLowerCase()];

    if (!key_element) {
        return;
    }
    key_element.classList.remove("hard_match", "soft_match", "no_match");

    if (state) {
        key_element.classList.add(state);
    }
}

/*
clears the match-state class from every key on the keyboard
*/
GameKeyboard.prototype.reset_key_states = function() {
    Object.values(this.key_elements).forEach(key_element => {
        key_element.classList.remove("hard_match", "soft_match", "no_match");
    });
}

// renders the virtual keyboard unresponsive once the game ends
GameKeyboard.prototype.disable = function() {
    this.disabled = true;
    this.container.classList.add("keyboard_disabled");
}

/*
renders the virtual keyboard responsive again when a new game is started
*/
GameKeyboard.prototype.enable = function() {
    this.disabled = false;
    this.container.classList.remove("keyboard_disabled");
}

// create a fresh virtual keyboard and assign event listeners
const keyboard = new GameKeyboard();
keyboard.onKeyPress = (key) => {
    if (key === "Enter") {
        handle_enter_press();
    }
    else if (key === "Backspace") {
        handle_backspace_press();
    }
    else {
        handle_letter_press(key);
    }
}
