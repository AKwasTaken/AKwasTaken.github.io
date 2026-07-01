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

  // Kick off the loop safely
  timeoutId = setTimeout(playTicker, tickerSpeed);
});