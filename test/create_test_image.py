#!/usr/bin/env python3
"""
Script para crear imagen de prueba con metadatos EXIF (GPS y timestamp)
Para pruebas del sistema UAP Analysis
"""

from PIL import Image, ImageDraw, ImageFont
import piexif
from datetime import datetime
import io

def decimal_to_dms(decimal_degree):
    """Convierte coordenadas decimales a formato DMS (Grados, Minutos, Segundos)"""
    is_positive = decimal_degree >= 0
    decimal_degree = abs(decimal_degree)
    
    degrees = int(decimal_degree)
    minutes_decimal = (decimal_degree - degrees) * 60
    minutes = int(minutes_decimal)
    seconds = (minutes_decimal - minutes) * 60
    
    return ((degrees, 1), (minutes, 1), (int(seconds * 100), 100))

def create_test_image_with_exif(output_path, lat=40.7128, lon=-74.0060, description="UAP Test Image"):
    """
    Crea una imagen de prueba con metadatos EXIF completos
    
    Args:
        output_path: Ruta donde guardar la imagen
        lat: Latitud (default: Nueva York)
        lon: Longitud (default: Nueva York)
        description: Descripción de la imagen
    """
    
    # Crear imagen de 800x600 con un "objeto luminoso"
    img = Image.new('RGB', (800, 600), color='#001122')  # Cielo nocturno
    draw = ImageDraw.Draw(img)
    
    # Dibujar "estrellas"
    import random
    random.seed(42)
    for _ in range(100):
        x = random.randint(0, 800)
        y = random.randint(0, 600)
        size = random.randint(1, 2)
        draw.ellipse([x, y, x+size, y+size], fill='white')
    
    # Dibujar "objeto luminoso" sospechoso (disco brillante)
    center_x, center_y = 400, 250
    for i in range(5, 0, -1):
        opacity = int(255 * (6-i) / 6)
        color = (255, 255, 200, opacity) if i > 3 else (255, 255, 150, opacity)
        radius = 15 + i * 8
        draw.ellipse([center_x - radius, center_y - radius, 
                     center_x + radius, center_y + radius], 
                    fill=f'#{255:02x}{255:02x}{int(200 - i*10):02x}')
    
    # Agregar texto en la imagen
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    draw.text((10, 10), "UAP Test Image", fill='white', font=font)
    draw.text((10, 570), f"Lat: {lat}, Lon: {lon}", fill='white', font=font)
    
    # Crear metadatos EXIF
    now = datetime.now()
    
    # Convertir coordenadas a formato DMS
    lat_dms = decimal_to_dms(abs(lat))
    lon_dms = decimal_to_dms(abs(lon))
    lat_ref = 'N' if lat >= 0 else 'S'
    lon_ref = 'E' if lon >= 0 else 'W'
    
    # Timestamp en formato EXIF
    exif_timestamp = now.strftime("%Y:%m:%d %H:%M:%S")
    
    exif_dict = {
        "0th": {
            piexif.ImageIFD.Make: "TestCamera",
            piexif.ImageIFD.Model: "UAP Test Model",
            piexif.ImageIFD.Software: "UAP Analysis Test Script",
            piexif.ImageIFD.DateTime: exif_timestamp,
            piexif.ImageIFD.ImageDescription: description.encode('utf-8'),
        },
        "Exif": {
            piexif.ExifIFD.DateTimeOriginal: exif_timestamp,
            piexif.ExifIFD.DateTimeDigitized: exif_timestamp,
            piexif.ExifIFD.FocalLength: (50, 1),
            piexif.ExifIFD.FNumber: (28, 10),  # f/2.8
            piexif.ExifIFD.ExposureTime: (1, 60),  # 1/60s
            piexif.ExifIFD.ISOSpeedRatings: 800,
        },
        "GPS": {
            piexif.GPSIFD.GPSLatitudeRef: lat_ref.encode('utf-8'),
            piexif.GPSIFD.GPSLatitude: lat_dms,
            piexif.GPSIFD.GPSLongitudeRef: lon_ref.encode('utf-8'),
            piexif.GPSIFD.GPSLongitude: lon_dms,
            piexif.GPSIFD.GPSAltitude: (100, 1),  # 100 metros sobre nivel del mar
            piexif.GPSIFD.GPSTimeStamp: (
                (now.hour, 1),
                (now.minute, 1),
                (now.second, 1)
            ),
            piexif.GPSIFD.GPSDateStamp: now.strftime("%Y:%m:%d").encode('utf-8'),
        }
    }
    
    # Convertir dict a bytes
    exif_bytes = piexif.dump(exif_dict)
    
    # Guardar imagen con EXIF
    img.save(output_path, "jpeg", quality=95, exif=exif_bytes)
    
    print(f"✅ Imagen creada: {output_path}")
    print(f"📍 GPS: {lat}, {lon}")
    print(f"📅 Timestamp: {exif_timestamp}")
    print(f"📏 Tamaño: 800x600px")
    print(f"💾 Descripción: {description}")

if __name__ == "__main__":
    import sys
    
    # Imagen 1: Nueva York (cielo nocturno con objeto luminoso)
    create_test_image_with_exif(
        "/tmp/test_uap_nyc.jpg",
        lat=40.7128,
        lon=-74.0060,
        description="Objeto luminoso avistado en Nueva York - Cielo nocturno"
    )
    
    # Imagen 2: Madrid (para probar diferentes condiciones)
    create_test_image_with_exif(
        "/tmp/test_uap_madrid.jpg",
        lat=40.4168,
        lon=-3.7038,
        description="Avistamiento en Madrid - Objeto circular brillante"
    )
    
    # Imagen 3: Chile (para probar hemisferio sur)
    create_test_image_with_exif(
        "/tmp/test_uap_chile.jpg",
        lat=-33.4489,
        lon=-70.6693,
        description="Avistamiento en Santiago de Chile - Formación de luces"
    )
    
    print("\n🎉 ¡3 imágenes de prueba creadas exitosamente!")
    print("\nPuedes subirlas en: http://localhost:3000")
    print("Ubicaciones:")
    print("  1. /tmp/test_uap_nyc.jpg - Nueva York")
    print("  2. /tmp/test_uap_madrid.jpg - Madrid")
    print("  3. /tmp/test_uap_chile.jpg - Santiago de Chile")
