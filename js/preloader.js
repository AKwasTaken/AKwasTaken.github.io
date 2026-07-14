// 1. FORCE SCROLL RESET IMMEDIATELY ON BOOT
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  // 2. TIMED PRELOADER ENGINE (Ensures a minimum 5000ms runtime)
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
      // Step 1: Make elements animate up and disappear instantly
      loader.classList.add("elements-out");
      
      // Step 2: Wait for elements to finish (400ms animation) + 300ms custom delay = 700ms total
      setTimeout(() => {
        // Step 3: Smoothly fade away the background screen and kick off the page hero animations
        loader.classList.add("fade-out");
        document.body.classList.add("hero-start");
        
        // Step 4: Clean up the DOM completely after the screen fade transition finishes (500ms)
        setTimeout(() => {
          loader.remove();
        }, 500);
        
      }, 300); 
    }
  });
});

// Backup scroll lock on page exit/refresh
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});