document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".link-icon, .logo-item").forEach(async (el) => {
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
        if (el.classList.contains("logo-item")) {
          svgElement.setAttribute("class", "logo-svg-icon");
        } else {
          svgElement.setAttribute("class", "lang-svg-icon");
        }
        
        el.replaceWith(svgElement);
      }
    } catch (err) {
      console.error("Failed to inline target SVG: ", url, err);
    }
  });
});