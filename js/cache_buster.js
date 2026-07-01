const link = document.createElement("link");
link.rel = "stylesheet";

// Appends a unique timestamp down to the minute so it stays fresh while editing
const timestamp = Math.floor(Date.now() / 60000);
link.href = "/css/style.min.css?v=" + timestamp;

document.head.appendChild(link);
