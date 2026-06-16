document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-link-icon").forEach(async (el) => {
    const url = el.getAttribute("data-src");
    if (!url) return;

    try {
      const response = await fetch(url);
      const svgText = await response.text();
      
      // Parse the text string into real inline HTML vector nodes
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = xmlDoc.querySelector("svg");

      if (svgElement) {
        // Apply your design layout hooks directly to the injected element
        svgElement.setAttribute("class", "lang-svg-icon");
        el.replaceWith(svgElement);
      }
    } catch (err) {
      console.error("Failed to inline target SVG: ", url, err);
    }
  });
});