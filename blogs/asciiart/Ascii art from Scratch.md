---
title: ASCII Art Generator from Scratch
date: 2026-06-23
---

## Prologue

Have you ever wondered how high-quality ASCII art generators actually map pixels to characters? A lot of simple generators out there just use a hardcoded string of characters sorted by vibe and intuitive brightness, like `" .:-=+*#%@"`. While that works as a quick hack, it isn't super precise. Different fonts render characters with entirely different weights, shapes, and aspect ratios.

I wanted to fix that. In this post, we are going to build an intelligent, highly accurate ASCII art generator. It dynamically calculates the absolute visual weight of characters from a real monospaced font (`UbuntuMono-Regular.ttf`), maps them to a normalized 0.0 to 1.0 scale, and turns any monochrome image into a beautiful textual masterpiece.

---


![Image](generated.png)

## The Core Concept

The game plan has five key milestones:

1. **Extracting Font Glyphs:** Reading the TrueType font (`.ttf`) file to grab all the printable characters.
2. **Measuring Glyph Densities:** Rendering each character onto a temporary canvas using `Pillow` and calculating the exact percentage of pixels filled.
3. **Normalization:** Scaling those weight values smoothly across a $[0, 1]$ interval.
4. **Image Preprocessing:** Tweaking the source image size, stretching or shrinking it to account for the font's tall character aspect ratio.
5. **Pixel Mapping:** Matching individual pixel lightness values against our calculated character densities using a nearest-neighbor approach.

---

## Phase 1: Environment Setup & Extracting Glyphs

First, we need to install our dependencies. We will use `fonttools` to look inside the font's internal character mappings (`cmap`), and `Pillow` to handle all the image and text rendering.

```bash
pip install fonttools pillow

```

Next, let's load the font and read all available characters. TrueType fonts organize their mappings in internal tables. We loop over these tables to extract valid Unicode values and filter out things you can't print.

```python
import sys
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

# Load the TrueType Font
ttf = TTFont("UbuntuMono-Regular.ttf")
characters = set()

# Extract printable characters from font tables
for table in ttf['cmap'].tables:
    for code, _ in table.cmap.items():
        char = chr(code)
        if char.isprintable():
            characters.add(char)

```

### Refining the Dataset

Extracting every single valid character from modern fonts can pull in thousands of weird Unicode glyphs, math operators, or regional scripts that screw up our density curve. To clean this up, we filter our selection down to a curated list saved in `characters.txt`.

```python
with open("characters.txt", "r") as f:
    lines = f.readlines()

# Clean and sort our curated character set
characters = sorted([line.strip() for line in lines if line.strip()])

```

---

## Phase 2: Calculating Exact Character Fill Percentages

Now for the fun part. Instead of guessing how "bright" a character is, we render each one onto a black canvas, color the text in pure white (`255`), and find the sum of all pixel values.

$$\text{Fill Percentage} = \frac{\sum \text{Pixel Values}}{\text{Width} \times \text{Height} \times 255}$$

```python
# Initialize the font structure at a readable point size
font = ImageFont.truetype("UbuntuMono-Regular.ttf", 20)

ascent, descent = font.getmetrics()
canvas_height = ascent + descent

result = []

for char in characters:
    char_width = font.getlength(char)
    width = int(round(char_width))
    height = int(round(canvas_height))

    # Catch edge cases where a glyph might be empty
    if width == 0 or height == 0:
        result.append((char, 0))
        continue

    # Render glyph onto a monochrome black canvas
    image = Image.new("L", (width, height), color=0)
    draw = ImageDraw.Draw(image)
    draw.text((0, 0), char, font=font, fill=255)

    # Calculate density
    pixels = list(image.getdata())
    max_weight = width * height * 255
    actual_weight = sum(pixels)

    fill_percentage = actual_weight / max_weight if max_weight > 0 else 0
    result.append((char, fill_percentage))

# Sort characters from darkest (least filled) to brightest (most filled)
result.sort(key=lambda x: x[1])

```

---

## Phase 3: Min-Max Normalization

The fill percentage of an average font will rarely span the absolute extremes of 0% to 100%. For example, a space character ` ` has a `0.0` fill, while a super dense character like `@` or `#` might top out around 35-40%.

To map these nicely to image pixels (which go all the way from fully black to fully white), we apply standard **Min-Max Normalization** to rescale our bounds cleanly between 0 and 1.

```python
min_val = min(result, key=lambda x: x[1])
max_val = max(result, key=lambda x: x[1])

adjusted_val = []

for x, y in result:
    # Rescale mathematically: (val - min) / (max - min)
    adj_y = (y - min_val[1]) / (max_val[1] - min_val[1]) if max_val[1] != min_val[1] else 0
    adjusted_val.append((x, adj_y))

# Explicitly ensure the empty space character represents absolute zero brightness
space_char = (' ', 0)
if ('`', 0.0) in adjusted_val:
    adjusted_val.remove(('`', 0.0))
adjusted_val.append(space_char)

# Final sort
adjusted_val.sort(key=lambda x: x[1])

```

---

## Phase 4: Image Processing & Aspect Ratio Correction

Images are made of square pixels, but terminal and monospaced font characters are usually tall rectangles. If you map pixels directly to characters 1:1, your ASCII image will look heavily stretched vertically.

To fix this, we apply a **font aspect correction factor** (usually around 0.4 to 0.5 for standard console fonts like Ubuntu Mono). We also invert the image values so that darker pixels match denser font characters (or vice-versa depending on your backdrop theme - here, we setup for dark backgrounds).

```python
# Open image and convert to monochrome Grayscale ("L")
img = Image.open("leaves.png").convert("L")

target_width = 200 
width_percent = target_width / float(img.size[0])

# Apply aspect ratio correction so the output isn't stretched
font_aspect_correction = 0.4 
target_height = int(float(img.size[1]) * width_percent * font_aspect_correction)

# Resize utilizing a clean Lanczos filter
img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)  

pixels = img.load()
width, height = img.size

lightness_val = []

for y in range(height):
    row = []
    for x in range(width):
        lightness = pixels[x, y] / 255
        lightness = 1 - lightness # Invert lightness depending on standard dark display
        row.append(lightness)
    lightness_val.append(row)

```

---

## Phase 5: Nearest-Neighbor Character Matching

With our image pixel values and font character densities both normalized between 0 and 1, matching them is incredibly simple. For each pixel, we find the absolute difference between its value and the densities of our character database, picking the closest match.

```python
def closest_linear(target):
    # Standard nearest match search
    return min(adjusted_val, key=lambda x: abs(x[1] - target))

```

Finally, we run through our preprocessed lightness grid, swap the values out for characters, and write them to a file.

```python
with open("ascii_art.txt", "w") as ascii_img:
    for row in lightness_val:
        line = ""
        for lightness in row:
            char, _ = closest_linear(lightness)
            line += char
        ascii_img.write(line + "\n")
        
print("ASCII art successfully generated and saved to ascii_art.txt!")

```

---

## Conclusion

By analyzing actual font glyph pixel density rather than just guessing weights arbitrarily, we created a generator that customizes its output to match the exact look of `Ubuntu Mono`.

The coolest part? You can swap out the `.ttf` file for any font (like *Courier New*, *Fira Code*, or even *Comic Sans*) to see how font design changes the final texture of the generated artwork!