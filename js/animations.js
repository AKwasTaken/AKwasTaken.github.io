document.addEventListener("DOMContentLoaded", () => {
  // 1. STANDARD SCROLL OBSERVER
  const standardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px",
  });

  // 2. BACKDROP GRAPHICS LATE OBSERVER
  const asciiObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -30% 0px",
  });

  // Track regular content text containers
  document.querySelectorAll(
    ".aboutme-heading-text, .aboutme-para-text"
  ).forEach((el) => standardObserver.observe(el));

  // Track custom illustration wrappers
  document.querySelectorAll(
    ".ascii-leaves-parent-container2, .ascii-bamboo-parent-container"
  ).forEach((el) => asciiObserver.observe(el));
});