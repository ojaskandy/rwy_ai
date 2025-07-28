#!/bin/bash

# Runway AI Photo Setup Script
# This script helps you organize photos for the floating frames on the landing page

echo "🎬 Runway AI Photo Setup"
echo "========================"
echo ""

# Create photos directory if it doesn't exist
mkdir -p client/public/photos

echo "📸 Setting up photo frames for your landing page..."
echo ""

# Check if photos directory exists and has photos
PHOTOS_DIR="client/public/photos"
PHOTO_COUNT=$(find "$PHOTOS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)

if [ "$PHOTO_COUNT" -eq 0 ]; then
    echo "📁 No photos found in $PHOTOS_DIR"
    echo ""
    echo "🔧 To add your photos:"
    echo "1. Copy your photos to: client/public/photos/"
    echo "2. Recommended: 15-20 photos for best effect"
    echo "3. Format: JPG, PNG, or WEBP"
    echo "4. Size: Square format (1:1 ratio) works best"
    echo ""
    echo "📝 The script will automatically rename them to:"
    echo "   photo-1.jpg, photo-2.jpg, photo-3.jpg, etc."
    echo ""
    echo "🚀 Run this script again after adding photos!"
else
    echo "✅ Found $PHOTO_COUNT photos in $PHOTOS_DIR"
    echo ""
    echo "🔄 Renaming photos to standard format..."
    
    # Counter for renaming
    counter=1
    
    # Process each photo
    for photo in "$PHOTOS_DIR"/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}; do
        if [ -f "$photo" ]; then
            # Get file extension
            extension="${photo##*.}"
            extension_lower=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
            
            # New filename
            new_name="$PHOTOS_DIR/photo-$counter.$extension_lower"
            
            # Rename if not already in correct format
            if [ "$photo" != "$new_name" ]; then
                mv "$photo" "$new_name"
                echo "  ✓ Renamed $(basename "$photo") → photo-$counter.$extension_lower"
            else
                echo "  ✓ photo-$counter.$extension_lower (already named correctly)"
            fi
            
            counter=$((counter + 1))
        fi
    done
    
    echo ""
    echo "🎉 Photo setup complete!"
    echo "📊 Total photos organized: $((counter - 1))"
    echo ""
    echo "💡 Tips:"
    echo "   • Photos will appear in floating frames on your landing page"
    echo "   • Top frames move right, bottom frames move left"
    echo "   • Frames have a slight rotation and hover effects"
    echo "   • If you add more photos later, run this script again"
    echo ""
    echo "🚀 Your landing page is ready to own the spotlight!"
fi

echo ""
echo "📍 Photo location: client/public/photos/"
echo "🌐 URL format: /photos/photo-1.jpg, /photos/photo-2.jpg, etc."
echo "" 