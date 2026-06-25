document.addEventListener("DOMContentLoaded", () => {
  const quotes = [
    "I dug my heels into the gravel as evidence for you to unravel",
    "If you’re reading this, remember: AI doesn’t have a soul, but you do. Go make proof of it.",
    "Lord I’m five hundred miles from my home",
    "And one day I’m gonna grow wings…",
    "I don’t know why you’re here. But know that you’re a wonder to the world. I’m proud of you.",
    "Be kind to yourself friend. I know you’ve been through a lot, and it’s going to be okay.",
    "If you’ve survived till now, take this as a sign. Live a little.",
    "Your choices, Clark, Your actions; that’s what makes you who you are. I couldn’t be… more proud of you.",
    "Maybe that’s the real punkrock ",
    "I don't need to be remembered, I just want the world to be a little better off for me having lived in it than not",
    "Your garden isn't thriving because every time a flower blooms, you cut it to prove to someone else that you're a gardener.",
    "It's hard to turn the page when you know someone won't be on the next chapter, but the story must go on.",
    "If familiarity guaranteed safety, then water wouldn’t boil the fish.",
    "Maybe we are just stardust pretending to be people.",
    "And maybe heartbreak is proof that the stardust remembers what it means to be light, even when it’s stuck in the dark.",
    "How strange it is to be anything at all.",
    "If a flower bloomed in the wrong season, will you call it a failure or a miracle?",
    "oh to be in the presence of something that makes everything around it look dull",
    "Profound thought doesn’t have to come from high places. The gutter looks at the stars too.",
    "I suppose success and defeat can look the same in a mirror",
    "Every atom in your body has already lived a longer, wilder life than you ever will. What’s your excuse to not live the way you love?",
    "You have to keep your sane, atleast for the people you love. It’ll get better, I promise.",
    "Trying to be someone else, is a waste of the person you are.",
    "To help, is a choice and not a trade. Expect nothing in return.",
    "Even after everything you’ve done… I would have saved you.",
    "It's never as bad as it seems. You're much stronger than you think you are. Trust me.",
    "Sometimes, just getting out of bed and facing the world is the most heroic thing you can do.",
    "You're going to change the world, friend. Even if you choose to be a farmer or a writer, you're going to change it just by being in it.",
    "We are on a floating rock, an insignificant dust among all reality, trying to make sense of it all. Nothing matters. So take a paper, and paint something badly.",
    "The universe doesn’t love you, because you are love.",
    "I would have liked merely doing laundry and taxes with you.",
    "I am a mosaic of everyone I've ever loved. Even for a second, even for a heartbeat.",
    "All we have to decide is what to do with the time that is given us.",
];

  function getDailyQuote(quoteArray) {
    if (!quoteArray || quoteArray.length === 0) return "No quotes available.";

    // 📅 Get the current date signature (YYYY-MM-DD)
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    // 🔢 Seed Hash Engine: Converts the date string into a deterministic number
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 🎲 Shuffling using our seeded hash to scramble the array index order cleanly
    const randomIndex = Math.abs(hash) % quoteArray.length;
    
    return quoteArray[randomIndex];
  }

  // Inject the chosen daily text line into the element node
  const quoteElement = document.getElementById("daily-quote-text");
  if (quoteElement) {
    quoteElement.textContent = `“${getDailyQuote(quotes)}”`;
  }
});