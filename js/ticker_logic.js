const track = document.getElementById('ticker-track');
const items = track.children;
const totalItems = items.length; // This is now 7
let index = 0;

setInterval(() => {
    // 1. Enable standard smooth animation transitions
    track.style.transition = "transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)";
    index++;
    
    // Move to the next word
    track.style.transform = `translateY(-${index * (100 / totalItems)}%)`;

    // 2. When we hit the cloned item at the very bottom...
    if (index === totalItems - 1) {
        setTimeout(() => {
            // Instantly kill the animation transition styles
            track.style.transition = "none";
            // Snap back to the absolute top item instantly
            index = 0;
            track.style.transform = `translateY(0%)`;
        }, 600); // 600ms matches the exact duration of your slide effect
    }
}, 1000); // Cycles every 2.5 seconds