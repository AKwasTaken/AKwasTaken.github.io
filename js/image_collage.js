const totalImages = 19;
const imagePathPrefix = "../assets/project_images/AK0-";
const track = document.getElementById('row-1'); // Target your unified single track wrapper

// Array blueprint defining the structural "variety" of your images.
// 'tall' = spans all 3 rows. 'wide' = landscape 1-row item. 'square' = standard 1-row tile.
const imageBlueprints = [
    'square', 'wide',   'tall',   'square', 'wide', 
    'square', 'tall',   'wide',   'square', 'square',
    'wide',   'square', 'tall',   'wide',   'square',
    'square', 'wide',   'square', 'tall'
];

function generateDynamicMasonry() {
    let bricksHTML = "";

    // Loop through your 19 images
    for (let i = 1; i <= totalImages; i++) {
        // Fallback to square if array bounds mismatch
        const type = imageBlueprints[i - 1] || 'square'; 
        let gridSpanClass = "";

        if (type === 'tall') {
            // Spans from row line 1 to row line 4 (Takes up all 3 row tracks from top to bottom)
            gridSpanClass = "span-all-rows";
        } else if (type === 'wide') {
            // Spans 1 row track vertically, but stretches wider horizontally
            gridSpanClass = "span-wide-horizontal";
        } else {
            // Standard bounding box unit
            gridSpanClass = "span-standard-square";
        }

        bricksHTML += `
            <div class="masonry-brick ${gridSpanClass}">
                <img src="${imagePathPrefix}${i}.jpg" alt="Project ${i}" class="brick-img">
            </div>`;
    }

    // Inject the raw layout bundle plus its identical duplicate clone for the infinite loop mirror
    track.innerHTML = bricksHTML + bricksHTML;
}

generateDynamicMasonry();