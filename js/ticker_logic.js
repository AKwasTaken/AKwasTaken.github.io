const track = document.getElementById('ticker-track');
const items = track.children;
const totalItems = items.length;

const tickerRestDuration = 75; 
const slideDuration = 200; // Time for the slide animation

const tickerSpeed = tickerRestDuration + slideDuration; // Total time for one full cycle (rest + slide)

let tickerIndex = 0;

function playTicker() {
    // 1. SPEED UP THE SLIDE: Dropped from 0.6s to 0.25s (250ms)
    // This gives it a punchy, mechanical click-into-place look
    track.style.transition = `transform ${slideDuration / 1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
    tickerIndex++;
    track.style.transform = `translateY(-${tickerIndex * (100 / totalItems)}%)`;

    // 2. YOUR TARGET DELAY: 400ms total loop window budget
    // The slide takes 250ms, meaning the text rests perfectly still for 150ms
    let nextDelay = tickerSpeed; 
    
    let checkIndex = tickerIndex;
    if (checkIndex === totalItems - 1) {
        checkIndex = 0; 
    }
    const currentItem = items[checkIndex];

    // 3. Gold delay check remains untouched
    if (currentItem.classList.contains('ticker-item-gold')) { 
        nextDelay = 5000; 
    }

    // 4. Seamless Reset Check: Executes EXACTLY at 250ms when the fast slide finishes
    if (tickerIndex === totalItems - 1) {
        setTimeout(() => {
            track.style.transition = "none"; // Kill transitions instantly
            tickerIndex = 0;
            track.style.transform = `translateY(0%)`; // Clean reset
        }, tickerSpeed * 0.625); // Evaluates to exactly 250ms to match the new slide duration
    }

    // Queue the next slide block
    setTimeout(playTicker, nextDelay);
}

// Start running immediately
setTimeout(playTicker, tickerSpeed);