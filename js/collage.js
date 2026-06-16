document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("dynamic-gallery-target");
  if (!container) return;

  try {
    const response = await fetch(container.getAttribute("data-include"));
    container.innerHTML = await response.text();
    initGalleryAutoScroll();
  } catch (err) {
    console.error("Failed to inject the masonry gallery file:", err);
  }
});

function initGalleryAutoScroll() {
  const row1 = document.getElementById("masonry-row-1");
  const row2 = document.getElementById("masonry-row-2");
  if (!row1 || !row2) return;

  const speed = 1.2; 
  let currentX = 0; 

  function scrollLoop() {
    // Move track leftwards nonstop
    currentX -= speed;

    const trackWidth = Math.max(row1.scrollWidth, row2.scrollWidth) + 20;
    const screenWidth = window.innerWidth;

    // Triggers your custom calculation limit multiplier boundary
    if (currentX <= -(trackWidth)) {
      currentX = screenWidth;
    }

    // Directly push translate coordinates to the hardware graphics layer
    row1.style.transform = `translateX(${currentX}px)`;
    row2.style.transform = `translateX(${currentX}px)`;
    
    requestAnimationFrame(scrollLoop);
  }

  requestAnimationFrame(scrollLoop);
}