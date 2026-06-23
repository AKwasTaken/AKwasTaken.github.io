fetch("../dist/gallery-images.html")
  .then((response) => {
    if (!response.ok)
      throw new Error("Gallery layout component not compiled yet.");
    return response.text();
  })
  .then((htmlMarkup) => {
    const target = document.getElementById("async-gallery-target");
    target.innerHTML = htmlMarkup;

    // 🚀 THE SYSTEM FIX: Add a class to the grid once the images are dropped in
    const grid = target.querySelector(".masonry-grid");
    if (grid) {
      grid.classList.add("masonry-ready");
    }
  })
  .catch((error) => {
    console.error("Error rendering image matrix content:", error);
  });
