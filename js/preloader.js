// 1. FORCE SCROLL RESET IMMEDIATELY ON BOOT
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  // 2. TIMED PRELOADER ENGINE (Ensures a minimum 700ms runtime)
  const minimumDisplayTime = new Promise(resolve => setTimeout(resolve, 1000));
  const pageHasLoaded = new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });

  // Clear overlay once dependencies settle
  Promise.all([pageHasLoaded, minimumDisplayTime]).then(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("fade-out");
      document.body.classList.add("hero-start");
      
      // Remove loader from the DOM when fade completes
      setTimeout(() => loader.remove(), 500);
    }
  });
});

// Backup scroll lock on page exit/refresh
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});