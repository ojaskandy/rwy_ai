#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_taegeuk_thumbnail(number, output_path):
    # Create image (400x300 for video thumbnail aspect ratio)
    width, height = 400, 300
    img = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        # Try to find a bold font
        font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttc", 180)
        font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttc", 24)
    except:
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 180)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        except:
            # Default font as fallback
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
    
    # Draw the large number in the center
    number_str = str(number)
    bbox = draw.textbbox((0, 0), number_str, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2 - 20  # Slightly above center
    
    draw.text((x, y), number_str, fill='white', font=font_large)
    
    # Draw a black belt (horizontal rectangle)
    belt_height = 20
    belt_y = height // 2 + 40
    draw.rectangle([(50, belt_y), (width - 50, belt_y + belt_height)], fill='#2a2a2a', outline='white', width=2)
    
    # Add small "TAEGEUK" text below
    taegeuk_text = "TAEGEUK"
    bbox = draw.textbbox((0, 0), taegeuk_text, font=font_small)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = belt_y + belt_height + 15
    
    draw.text((x, y), taegeuk_text, fill='#888888', font=font_small)
    
    # Save the image
    img.save(output_path, 'JPEG', quality=95)
    print(f"✅ Created: {output_path}")

def create_heian_thumbnail(kata_name, output_path):
    # Create image for Heian kata
    width, height = 400, 300
    img = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttc", 80)
        font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttc", 24)
    except:
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
    
    # Draw "HEIAN" text
    heian_text = "HEIAN"
    bbox = draw.textbbox((0, 0), heian_text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2 - 20
    
    draw.text((x, y), heian_text, fill='white', font=font_large)
    
    # Draw a black belt
    belt_height = 20
    belt_y = height // 2 + 40
    draw.rectangle([(50, belt_y), (width - 50, belt_y + belt_height)], fill='#2a2a2a', outline='white', width=2)
    
    # Add kata name text below (SHODAN or NIDAN)
    bbox = draw.textbbox((0, 0), kata_name, font=font_small)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = belt_y + belt_height + 15
    
    draw.text((x, y), kata_name, fill='#888888', font=font_small)
    
    # Save the image
    img.save(output_path, 'JPEG', quality=95)
    print(f"✅ Created: {output_path}")

def main():
    print("🎨 Creating martial arts thumbnails...")
    
    # Base paths
    taekwondo_dir = "../client/public/videos/taekwondo"
    karate_dir = "../client/public/videos/karate"
    
    # Create directories if they don't exist
    os.makedirs(taekwondo_dir, exist_ok=True)
    os.makedirs(karate_dir, exist_ok=True)
    
    # Create Taegeuk thumbnails (1-8)
    taegeuk_names = [
        "Taegeuk 1 Il Jang.jpg",
        "Taegeuk 2 Ee Jang.jpg", 
        "Taegeuk 3 Sam Jang.jpg",
        "Taegeuk 4 Sa Jang.jpg",
        "Taegeuk 5 Oh Jang.jpg",
        "Taegeuk 6 Yook Jang.jpg",
        "Taegeuk 7 Chil Jang.jpg",
        "Taegeuk 8 Pal Jang.jpg"
    ]
    
    for i, filename in enumerate(taegeuk_names, 1):
        output_path = os.path.join(taekwondo_dir, filename)
        create_taegeuk_thumbnail(i, output_path)
    
    # Create Heian kata thumbnails
    heian_shodan_path = os.path.join(karate_dir, "Heian Shodan.jpg")
    create_heian_thumbnail("SHODAN", heian_shodan_path)
    
    heian_nidan_path = os.path.join(karate_dir, "Heian Nidan.jpg")
    create_heian_thumbnail("NIDAN", heian_nidan_path)
    
    heian_sandan_path = os.path.join(karate_dir, "Heian Sandan.jpg")
    create_heian_thumbnail("SANDAN", heian_sandan_path)
    
    print("\n🎯 All thumbnails created successfully!")
    print(f"📁 Taekwondo thumbnails: {taekwondo_dir}")
    print(f"📁 Karate thumbnails: {karate_dir}")

if __name__ == "__main__":
    main() 