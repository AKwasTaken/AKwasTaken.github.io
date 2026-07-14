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
      // Step 1: Start the exit animations for the dots and the background screen.
      // (CSS handles the 300ms delay before the background starts fading out)
      loader.classList.add("elements-out", "fade-out");
      
      // Step 2: Wait until the background fade-out transition completely finishes
      loader.addEventListener('transitionend', (e) => {
        if (e.target === loader && e.propertyName === 'opacity') {
          
          // Step 3: Remove the loader from the DOM first so it's entirely gone
          loader.remove();
          
          // Step 4: Fire the hero animations NOW. 
          // They will start cleanly on a completely clear viewport.
          document.body.classList.add("hero-start");
        }
      });
    }
  });
});

// Backup scroll lock on page exit/refresh
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});