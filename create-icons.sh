# Simple PNG icon creation script (requires ImageMagick or similar)
# This creates basic placeholder icons in different sizes

# Create a simple 128x128 icon with text
convert -size 128x128 gradient:"#667eea-#764ba2" \
        -gravity center -pointsize 32 -fill white \
        -annotate 0 "FP" icons/icon128.png

# Create other sizes
convert icons/icon128.png -resize 48x48 icons/icon48.png
convert icons/icon128.png -resize 32x32 icons/icon32.png
convert icons/icon128.png -resize 16x16 icons/icon16.png

echo "Icons created! If you don't have ImageMagick, you can:"
echo "1. Use any image editor to create simple 128x128, 48x48, 32x32, and 16x16 PNG files"
echo "2. Use online icon generators"
echo "3. The extension will work without custom icons (Chrome will use defaults)"
