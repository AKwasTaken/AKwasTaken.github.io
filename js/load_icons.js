document.addEventListener("DOMContentLoaded", async () => {
  const targets = Array.from(document.querySelectorAll(".link-icon, .logo-item"));
  const asciiContainer1 = document.getElementById("ascii-leaf-container");
  const asciiContainer2 = document.getElementById("ascii-leaves-container");
  const asciiContainer3 = document.getElementById("ascii-bamboo-container");

  
  const parser = new DOMParser();
  const fetchPromises = [];

  targets.forEach((el) => {
    const url = el.getAttribute("data-src");
    if (!url) return;

    fetchPromises.push(
      fetch(url)
        .then(res => res.ok ? res.text() : null)
        .then(text => text ? { type: 'icon', el, text } : null)
        .catch(err => {
          console.error("Failed to fetch SVG: ", url, err);
          return null;
        })
    );
  });

  if (asciiContainer1) {
    const asciiUrl = asciiContainer1.getAttribute("data-src");
    if (asciiUrl) {
      fetchPromises.push(
        fetch(asciiUrl)
          .then(res => {
            if (!res.ok) throw new Error("Failed to load SVG layout asset.");
            return res.text();
          })
          .then(text => ({ type: 'ascii', el: asciiContainer1, text }))
          .catch(err => {
            console.error("Error loading accessible ASCII SVG:", err);
            return null;
          })
      );
    }
  }

  if (asciiContainer2) {
    const asciiUrl = asciiContainer2.getAttribute("data-src");
    if (asciiUrl) {
      fetchPromises.push(
        fetch(asciiUrl)
          .then(res => {
            if (!res.ok) throw new Error("Failed to load SVG layout asset.");
            return res.text();
          })
          .then(text => ({ type: 'ascii', el: asciiContainer2, text }))
          .catch(err => {
            console.error("Error loading accessible ASCII SVG:", err);
            return null;
          })
      );
    }
  }

  if (asciiContainer3) {
    const asciiUrl = asciiContainer3.getAttribute("data-src");
    if (asciiUrl) {
      fetchPromises.push(
        fetch(asciiUrl)
          .then(res => {
            if (!res.ok) throw new Error("Failed to load SVG layout asset.");
            return res.text();
          })
          .then(text => ({ type: 'ascii', el: asciiContainer3, text }))
          .catch(err => {
            console.error("Error loading accessible ASCII SVG:", err);
            return null;
          })
      );
    }
  }

  const results = await Promise.all(fetchPromises);

  requestAnimationFrame(() => {
    results.forEach((result) => {
      if (!result) return;
      const { type, el, text } = result;

      if (type === 'icon') {
        const xmlDoc = parser.parseFromString(text, "image/svg+xml");
        const svgElement = xmlDoc.querySelector("svg");

        if (svgElement) {
          const className = el.classList.contains("logo-item") 
            ? "logo-svg-icon" 
            : "lang-svg-icon";
          
          svgElement.setAttribute("class", className);
          el.replaceWith(svgElement);
        }
      } else if (type === 'ascii') {
        el.innerHTML = text;
      }
    });
  });
});