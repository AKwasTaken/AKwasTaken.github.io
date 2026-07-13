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

  // 2. LATE OBSERVER MECHANICS
  const asciiObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -40% 0px",
  });

  // Target registration lists (Wipes out components initialized on load)
  document.querySelectorAll(
    ".project-heading-text, .project-card-link, .projects-page-link, .blog-heading-text, .blog-single-link, .blog-page-link, .aboutme-heading-text, .aboutme-para-text"
  ).forEach((el) => standardObserver.observe(el));

  document.querySelectorAll(
    ".ascii-leaf-parent-container, .ascii-leaves-parent-container, .ascii-leaves-parent-container2, .ascii-bamboo-parent-container"
  ).forEach((el) => asciiObserver.observe(el));
});