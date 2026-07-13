document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const items = track.children;
  const totalItems = items.length;

  const tickerRestDuration = 75; 
  const slideDuration = 200; 
  const tickerSpeed = tickerRestDuration + slideDuration;

  let tickerIndex = 0;
  let timeoutId = null;

  function playTicker() {
    tickerIndex++;
    
    // Batch DOM updates cleanly inside a single frame callback
    requestAnimationFrame(() => {
      track.style.transition = `transform ${slideDuration / 1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
      track.style.transform = `translateY(-${tickerIndex * (100 / totalItems)}%)`;
    });

    let nextDelay = tickerSpeed; 
    let checkIndex = tickerIndex % (totalItems - 1);
    
    // Check for the special gold item
    if (items[checkIndex] && items[checkIndex].classList.contains('ticker-item-gold')) { 
      nextDelay = 5000; 
    }

    // Seamless Reset Check
    if (tickerIndex === totalItems - 1) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          track.style.transition = "none"; 
          tickerIndex = 0;
          track.style.transform = `translateY(0%)`;
        });
      }, slideDuration); // Fire exactly when the slide finishes
    }

    timeoutId = setTimeout(playTicker, nextDelay);
  }

  // CRITICAL FIX: Instead of running instantly on DOM load, wait for the preloader to drop
  function initTickerOnHeroReveal() {
    // If the loading screen already finished before this script ran, initialize instantly
    if (document.body.classList.contains('hero-start')) {
      timeoutId = setTimeout(playTicker, 1200); // 1.2s delay allows hero entrance animation to settle smoothly
    } else {
      // Create a MutationObserver to watch the body tag for the 'hero-start' class
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && document.body.classList.contains('hero-start')) {
            timeoutId = setTimeout(playTicker, 1200); // Kick off only when hero is visible and finished animating
            observer.disconnect(); // Disconnect observer to keep code lightweight
          }
        });
      });
      observer.observe(document.body, { attributes: true });
    }
  }

  // Fire initialization engine safely
  initTickerOnHeroReveal();
});