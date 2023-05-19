var modal_h = document.getElementById("help-modal");
var btn_h = document.getElementById("btn-help");
var span_h = document.getElementsByClassName("help-close")[0];

var modal_m = document.getElementById("music-modal");
var btn_m = document.getElementById("btn-music");
var span_m = document.getElementsByClassName("music-close")[0];

var modal_b = document.getElementById("bg-modal");
var btn_b = document.getElementById("btn-bg");
var span_b = document.getElementsByClassName("bg-close")[0];


btn_h.onclick = function() {
    modal_h.style.display = "block";
}

btn_m.onclick = function() {
    modal_m.style.display = "block";
}

btn_b.onclick = function() {
    modal_b.style.display = "block";
}

span_h.onclick = function() {
    modal_h.style.display = "none";
}

span_m.onclick = function() {
    modal_m.style.display = "none";
}

span_b.onclick = function() {
    modal_b.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal_h) {
        modal_h.style.display = "none";
    } else if (event.target == modal_m) {
        modal_m.style.display = "none";
    } else if (event.target == modal_b) {
        modal_b.style.display = "none";
    }
}