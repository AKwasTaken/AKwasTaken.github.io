// 1. FORCE SCROLL RESET IMMEDIATELY ON BOOT
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  // 2. TIMED PRELOADER ENGINE
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
      // Step 1: Start the exit animations for the loader elements
      loader.classList.add("elements-out", "fade-out");
      
      // Step 2: Fire the content hero animations NOW as the background starts dissolving.
      // This bridges the visual gap so elements lift up smoothly over the static background.
      document.body.classList.add("hero-start");
      
      // Step 3: Wait until the background fade-out transition completely finishes to drop the node
      loader.addEventListener('transitionend', (e) => {
        if (e.target === loader && e.propertyName === 'opacity') {
          loader.remove();
        }
      });
    }
  });
});

// Backup scroll lock on page exit/refresh
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});