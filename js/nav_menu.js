// Hamburger Menu Toggle Logic
const menuToggle = document.getElementById("menu-toggle");
const navbar = document.querySelector(".navbar");

// Toggle menu on button click
menuToggle.addEventListener("click", (event) => {
  navbar.classList.toggle("active");
  menuToggle.classList.toggle("open");
  
  // Prevent this click from instantly triggering the global document listener below
  event.stopPropagation();
});

// Close menu when clicking anywhere outside the navbar
document.addEventListener("click", (event) => {
  // Check if the navbar is currently open
  if (navbar.classList.contains("active")) {
    // If the click was NOT inside the navbar container, close it
    if (!navbar.contains(event.target)) {
      navbar.classList.remove("active");
      menuToggle.classList.remove("open");
    }
  }
});