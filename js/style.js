const map = document.querySelector(".map");
const section = document.querySelector(".section");
const sidebar = document.querySelector(".sidebar");
const transport_options = sidebar.querySelector(".transport-options");
function myFunction(x) {
  if (x.matches) {
    // If media query matches
    sidebar.insertBefore(map, transport_options);
  } else {
    section.appendChild(map);
  }
}

// Create a MediaQueryList object
var x = window.matchMedia("(max-width: 1025px)");

// Call listener function at run time
myFunction(x);

// Attach listener function on state changes
x.addEventListener("change", function () {
  myFunction(x);
});
