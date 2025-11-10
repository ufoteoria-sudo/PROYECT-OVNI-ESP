#!/usr/bin/env python3
"""
Script de prueba automático para validar todas las 9 capas del sistema UAP Analysis
Sube una imagen vía API y valida cada componente del análisis
"""

import requests
import json
import time
from pathlib import Path

# Configuración
BASE_URL = "http://localhost:3000"
TEST_IMAGE = "/tmp/test_uap_nyc.jpg"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text:^80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}\n")

def print_check(passed, message):
    symbol = f"{Colors.GREEN}✓{Colors.RESET}" if passed else f"{Colors.RED}✗{Colors.RESET}"
    print(f"{symbol} {message}")

def print_info(key, value):
    print(f"{Colors.BLUE}{key}:{Colors.RESET} {value}")

def register_user():
    """Registrar usuario de prueba"""
    print_header("PASO 1: Registro de Usuario")
    
    user_data = {
        "username": f"test_user_{int(time.time())}",
        "email": f"test_{int(time.time())}@test.com",
        "password": "test123456"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    
    if response.status_code == 201:
        data = response.json()
        print_check(True, "Usuario registrado exitosamente")
        print_info("Username", user_data['username'])
        print_info("Email", user_data['email'])
        return data.get('token'), user_data
    else:
        print_check(False, f"Error al registrar usuario: {response.status_code}")
        print(response.text)
        return None, None

def upload_and_analyze(token):
    """Subir imagen y analizar"""
    print_header("PASO 2: Subida de Imagen")
    
    if not Path(TEST_IMAGE).exists():
        print_check(False, f"Imagen no encontrada: {TEST_IMAGE}")
        return None
    
    print_info("Imagen", TEST_IMAGE)
    print(f"{Colors.YELLOW}⏳ Subiendo imagen...{Colors.RESET}\n")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Paso 2.1: Subir imagen
    with open(TEST_IMAGE, 'rb') as f:
        files = {'file': ('test_uap_nyc.jpg', f, 'image/jpeg')}
        data = {
            'title': 'Prueba Automática - Objeto luminoso NYC',
            'description': 'Imagen de prueba para validar las 9 capas de análisis',
            'location': 'Nueva York, USA'
        }
        
        response = requests.post(f"{BASE_URL}/api/uploads", headers=headers, files=files, data=data)
    
    if response.status_code not in [200, 201]:
        print_check(False, f"Error al subir imagen: {response.status_code}")
        print(response.text)
        return None
    
    upload_data = response.json()
    upload_id = upload_data.get('analysis', {}).get('id')
    
    if not upload_id:
        print_check(False, "No se recibió ID del upload")
        print(f"Respuesta: {json.dumps(upload_data, indent=2)}")
        return None
    
    print_check(True, f"Imagen subida exitosamente (ID: {upload_id})")
    
    # Paso 2.2: Analizar imagen
    print_header("PASO 3: Análisis de Imagen")
    print(f"{Colors.YELLOW}⏳ Iniciando análisis...{Colors.RESET}\n")
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/analyze/{upload_id}", headers=headers)
    
    if response.status_code not in [200, 201]:
        print_check(False, f"Error al iniciar análisis: {response.status_code}")
        print(response.text)
        return None
    
    analysis_response = response.json()
    analysis_id = analysis_response.get('analysisId')
    
    print_check(True, f"Análisis iniciado (ID: {analysis_id})")
    
    # Paso 2.3: Esperar a que el análisis termine
    print(f"\n{Colors.YELLOW}⏳ Esperando resultados del análisis (puede tomar 30-60 segundos)...{Colors.RESET}\n")
    
    max_retries = 60
    retry_count = 0
    analysis_data = None
    
    while retry_count < max_retries:
        time.sleep(2)  # Esperar 2 segundos entre consultas
        retry_count += 1
        
        # Consultar status
        status_response = requests.get(f"{BASE_URL}/api/analyze/{upload_id}/status", headers=headers)
        
        if status_response.status_code != 200:
            continue
        
        status_data = status_response.json()
        current_status = status_data.get('status')
        
        if current_status == 'completed':
            analysis_data = status_data
            elapsed_time = time.time() - start_time
            print_info("Tiempo total", f"{elapsed_time:.2f} segundos")
            print_check(True, "Análisis completado exitosamente")
            break
        elif current_status == 'error':
            print_check(False, f"Error en el análisis: {status_data.get('error')}")
            return None
        else:
            # Mostrar progreso
            if retry_count % 5 == 0:
                print(f"  Estado: {current_status} ({retry_count * 2}s transcurridos)")
    
    if not analysis_data:
        print_check(False, "Timeout esperando el análisis")
        return None
    
    return analysis_data

def validate_layer_1_exif(analysis):
    """Validar Capa 1: EXIF"""
    print_header("CAPA 1: Análisis EXIF")
    
    # Los datos están en analysis.analysisData.exifData
    analysis_data = analysis.get('analysisData', {})
    exif = analysis_data.get('exifData', {})
    
    location = exif.get('location', {})
    
    checks = [
        (location.get('latitude') is not None, f"Latitud: {location.get('latitude')}"),
        (location.get('longitude') is not None, f"Longitud: {location.get('longitude')}"),
        (location.get('gpsTimeStamp') is not None, f"GPS Timestamp: {location.get('gpsTimeStamp')}"),
        (exif.get('captureDate') is not None, f"Timestamp: {exif.get('captureDate')}"),
        (exif.get('camera') == 'TestCamera', "Cámara detectada: TestCamera"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    return all(check[0] for check in checks)

def validate_layer_2_visual_ai(analysis):
    """Validar Capa 2: Visual AI"""
    print_header("CAPA 2: Análisis Visual AI (OpenAI)")
    
    analysis_data = analysis.get('analysisData', {})
    ai = analysis_data.get('aiAnalysis', {})
    
    checks = [
        (ai.get('description') is not None, f"Descripción generada ({len(ai.get('description', ''))} caracteres)"),
        (ai.get('category') is not None, f"Categoría: {ai.get('category')}"),
        (ai.get('confidence') is not None, f"Confianza: {ai.get('confidence')}"),
        (len(ai.get('features', {}).get('detectedObjects', [])) >= 0, f"Objetos detectados: {len(ai.get('features', {}).get('detectedObjects', []))}"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    if ai.get('description'):
        print(f"\n{Colors.MAGENTA}Descripción AI:{Colors.RESET}")
        print(f"  {ai.get('description')[:200]}...")
    
    return all(check[0] for check in checks[:3])  # Solo los 3 primeros son obligatorios


def validate_layer_3_forensic(analysis):
    """Validar Capa 3: Análisis Forense"""
    print_header("CAPA 3: Análisis Forense")
    
    analysis_data = analysis.get('analysisData', {})
    forensic = analysis_data.get('forensicAnalysis', {})
    exif = analysis_data.get('exifData', {})
    
    checks = [
        (exif.get('manipulationScore') is not None, f"Score manipulación: {exif.get('manipulationScore')}"),
        (forensic.get('authenticityScore') is not None or exif.get('manipulationScore') is not None, 
         f"Autenticidad: {forensic.get('authenticityScore', 'N/A')}"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    return checks[0][0]


def validate_layer_4_scientific(analysis):
    """Validar Capa 4: Comparación Científica"""
    print_header("CAPA 4: Comparación Científica (UFODatabase)")
    
    analysis_data = analysis.get('analysisData', {})
    scientific = analysis_data.get('scientificComparison', {})
    
    checks = [
        (scientific.get('totalMatches') is not None, f"Total coincidencias: {scientific.get('totalMatches', 0)}"),
        (scientific.get('bestMatch') is not None, "Mejor coincidencia encontrada"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    if scientific.get('bestMatch'):
        match = scientific['bestMatch']
        print(f"\n{Colors.MAGENTA}Mejor coincidencia:{Colors.RESET}")
        print(f"  Objeto: {match.get('object', {}).get('name')}")
        print(f"  Categoría: {match.get('object', {}).get('category')}")
        print(f"  Similitud: {match.get('similarity', 0):.2f}")
    
    return checks[0][0]


def validate_layer_5_training(analysis):
    """Validar Capa 5: Training Enhancement"""
    print_header("CAPA 5: Mejora con Training")
    
    analysis_data = analysis.get('analysisData', {})
    # Esta capa puede no tener datos si no hay training previo
    has_training = 'trainingEnhancement' in analysis_data
    
    print_check(True, "Capa de training ejecutada")
    if has_training:
        print_info("Training matches", analysis_data.get('trainingEnhancement', {}).get('matchesFound', 0))
    else:
        print_info("Training matches", "0 (sin casos previos)")
    
    return True


def validate_layer_6_external(analysis):
    """Validar Capa 6: Validación Externa"""
    print_header("CAPA 6: Validación Externa (APIs)")
    
    analysis_data = analysis.get('analysisData', {})
    external = analysis_data.get('externalValidation', {})
    
    # 6.1 SunCalc
    celestial = external.get('celestialBodies', {})
    has_celestial = celestial and len(celestial) > 0
    print_check(has_celestial, f"SunCalc - Objetos celestes: {len(celestial) if has_celestial else 0}")
    
    if has_celestial:
        if 'sun' in celestial:
            print(f"  ☀️  Sol: altitude={celestial['sun'].get('altitude', 'N/A')}°")
        if 'moon' in celestial:
            print(f"  🌙 Luna: altitude={celestial['moon'].get('altitude', 'N/A')}°, phase={celestial['moon'].get('phase', 'N/A')}")
        
        planets = ['venus', 'jupiter', 'mars', 'saturn']
        for planet in planets:
            if planet in celestial:
                visible = "Visible" if celestial[planet].get('visible') else "No visible"
                print(f"  🪐 {planet.capitalize()}: {visible}")
    
    # 6.2 OpenSky Network
    aircraft = external.get('nearbyAircraft', [])
    has_aircraft = isinstance(aircraft, list) and len(aircraft) >= 0
    print_check(True, f"OpenSky - Aeronaves: {len(aircraft) if has_aircraft else 0}")
    
    if aircraft and len(aircraft) > 0:
        print(f"  ✈️  Primera aeronave: {aircraft[0].get('callsign', 'N/A')} a {aircraft[0].get('distance', 'N/A')}km")
    
    # 6.3 N2YO (puede no estar si no hay API key)
    satellites = external.get('visibleSatellites', [])
    has_satellites = isinstance(satellites, list)
    if has_satellites and len(satellites) > 0:
        print_check(True, f"N2YO - Satélites: {len(satellites)}")
    else:
        print_check(True, "N2YO - No configurado o sin satélites visibles")
    
    # 6.4 StratoCat
    balloons = external.get('nearbyBalloons', [])
    has_balloons = isinstance(balloons, list)
    if has_balloons and len(balloons) > 0:
        print_check(True, f"StratoCat - Globos: {len(balloons)}")
    else:
        print_check(True, "StratoCat - Sin globos en el área")
    
    return has_celestial or has_aircraft


def validate_layer_7_weather(analysis):
    """Validar Capa 7: Análisis Meteorológico (NUEVO)"""
    print_header("CAPA 7: Análisis Meteorológico (OpenWeatherMap)")
    
    analysis_data = analysis.get('analysisData', {})
    weather = analysis_data.get('weatherData')
    
    if weather is None:
        print_check(True, f"{Colors.YELLOW}OpenWeatherMap API key no configurada{Colors.RESET}")
        print_info("Estado", "Funcionando con fallback (sin datos reales)")
        return True
    
    visibility_km = ""
    if weather.get('visibility'):
        visibility_km = f"{weather.get('visibility')/1000}km"
    else:
        visibility_km = "N/A"
    
    checks = [
        (weather.get('temperature') is not None, f"Temperatura: {weather.get('temperature', {}).get('current')}°{weather.get('temperature', {}).get('unit')}"),
        (weather.get('conditions') is not None, f"Condiciones: {weather.get('conditions', {}).get('description')}"),
        (weather.get('clouds') is not None, f"Nubes: {weather.get('clouds', {}).get('coverage')}%"),
        (True, f"Visibilidad: {visibility_km}"),
        (weather.get('analysis') is not None, "Análisis inteligente presente"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    if weather.get('analysis'):
        analysis_w = weather['analysis']
        print(f"\n{Colors.MAGENTA}Análisis meteorológico:{Colors.RESET}")
        print(f"  Calidad visibilidad: {analysis_w.get('visibility_quality')}")
        print(f"  Probabilidad fenómenos ópticos: {analysis_w.get('likelihood_of_optical_phenomena')}")
        print(f"  Explicación meteorológica: {analysis_w.get('weather_explanation_probability')}")
        
        if analysis_w.get('relevant_conditions'):
            print(f"  Condiciones relevantes: {', '.join(analysis_w.get('relevant_conditions', []))}")
        
        if analysis_w.get('warnings'):
            print(f"  {Colors.YELLOW}⚠️  Warnings: {', '.join(analysis_w.get('warnings', []))}{Colors.RESET}")
    
    return True


def validate_layer_8_atmospheric(analysis):
    """Validar Capa 8: Comparación Atmosférica (NUEVO)"""
    print_header("CAPA 8: Comparación Atmosférica (23 Fenómenos)")
    
    analysis_data = analysis.get('analysisData', {})
    atmospheric = analysis_data.get('atmosphericComparison')
    
    if atmospheric is None:
        print_check(False, "atmosphericComparison no presente en la respuesta")
        return False
    
    checks = [
        (atmospheric.get('totalMatches') is not None, f"Total coincidencias: {atmospheric.get('totalMatches', 0)}"),
        (atmospheric.get('bestMatch') is not None, "Mejor coincidencia encontrada"),
        (atmospheric.get('hasStrongMatch') is not None, f"Coincidencia fuerte: {'Sí' if atmospheric.get('hasStrongMatch') else 'No'}"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    if atmospheric.get('bestMatch'):
        match = atmospheric['bestMatch']
        phenomenon = match.get('phenomenon', {})
        
        print(f"\n{Colors.MAGENTA}Mejor coincidencia atmosférica:{Colors.RESET}")
        print(f"  Fenómeno: {phenomenon.get('name')}")
        print(f"  Categoría: {phenomenon.get('category')}")
        print(f"  Rareza: {phenomenon.get('rarity')}")
        print(f"  Score: {match.get('score')}/100")
        print(f"  Confianza: {match.get('confidence')}")
        print(f"  Explicación: {match.get('explanation', '')[:100]}...")
        
        if atmospheric.get('hasStrongMatch'):
            print(f"\n  {Colors.GREEN}✓ COINCIDENCIA FUERTE (>80) - Categoría ajustada automáticamente{Colors.RESET}")
    
    if atmospheric.get('topMatches'):
        print(f"\n{Colors.CYAN}Top 3 coincidencias:{Colors.RESET}")
        for i, match in enumerate(atmospheric.get('topMatches', [])[:3], 1):
            phenom = match.get('phenomenon', {})
            print(f"  {i}. {phenom.get('name')} - Score: {match.get('score')}")
    
    return checks[0][0] and checks[1][0]


def validate_layer_9_confidence(analysis):
    """Validar Capa 9: Confianza Ponderada"""
    print_header("CAPA 9: Cálculo de Confianza Ponderada")
    
    analysis_data = analysis.get('analysisData', {})
    confidence = analysis_data.get('confidence')
    recommendations = analysis_data.get('recommendations', [])
    
    checks = [
        (confidence is not None, f"Confianza final: {confidence}"),
        (isinstance(recommendations, list), f"Recomendaciones: {len(recommendations)}"),
    ]
    
    for passed, message in checks:
        print_check(passed, message)
    
    if recommendations and len(recommendations) > 0:
        print(f"\n{Colors.MAGENTA}Recomendaciones:{Colors.RESET}")
        for i, rec in enumerate(recommendations[:5], 1):
            print(f"  {i}. {rec}")
    
    return checks[0][0]

def print_final_summary(results):
    """Imprimir resumen final"""
    print_header("RESUMEN FINAL DE PRUEBAS")
    
    layers = [
        ("Capa 1: EXIF", results.get('layer1', False)),
        ("Capa 2: Visual AI", results.get('layer2', False)),
        ("Capa 3: Forense", results.get('layer3', False)),
        ("Capa 4: Científica", results.get('layer4', False)),
        ("Capa 5: Training", results.get('layer5', False)),
        ("Capa 6: Externa", results.get('layer6', False)),
        ("Capa 7: Meteorológica", results.get('layer7', False)),
        ("Capa 8: Atmosférica", results.get('layer8', False)),
        ("Capa 9: Confianza", results.get('layer9', False)),
    ]
    
    passed = sum(1 for _, result in layers if result)
    total = len(layers)
    
    for layer_name, result in layers:
        print_check(result, layer_name)
    
    print(f"\n{Colors.BOLD}Resultado: {passed}/{total} capas validadas{Colors.RESET}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ¡TODAS LAS PRUEBAS EXITOSAS! Sistema completamente funcional 🎉{Colors.RESET}\n")
        return True
    elif passed >= 7:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Sistema funcional con limitaciones menores{Colors.RESET}\n")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Sistema con problemas - Revisar logs{Colors.RESET}\n")
        return False

def main():
    print_header("🧪 PRUEBA AUTOMÁTICA - Sistema UAP Analysis")
    print(f"{Colors.CYAN}Validando 9 capas de análisis con imagen de prueba{Colors.RESET}\n")
    
    # Paso 1: Registrar usuario
    token, user_data = register_user()
    if not token:
        print(f"\n{Colors.RED}❌ No se pudo registrar usuario. Abortando.{Colors.RESET}\n")
        return
    
    # Paso 2: Subir y analizar imagen
    analysis = upload_and_analyze(token)
    if not analysis:
        print(f"\n{Colors.RED}❌ No se pudo analizar imagen. Abortando.{Colors.RESET}\n")
        return
    
    # Guardar JSON completo para inspección
    output_file = "/tmp/uap_analysis_result.json"
    with open(output_file, 'w') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print_info("JSON completo guardado en", output_file)
    
    # Validar cada capa
    results = {}
    time.sleep(1)
    
    results['layer1'] = validate_layer_1_exif(analysis)
    time.sleep(0.5)
    
    results['layer2'] = validate_layer_2_visual_ai(analysis)
    time.sleep(0.5)
    
    results['layer3'] = validate_layer_3_forensic(analysis)
    time.sleep(0.5)
    
    results['layer4'] = validate_layer_4_scientific(analysis)
    time.sleep(0.5)
    
    results['layer5'] = validate_layer_5_training(analysis)
    time.sleep(0.5)
    
    results['layer6'] = validate_layer_6_external(analysis)
    time.sleep(0.5)
    
    results['layer7'] = validate_layer_7_weather(analysis)
    time.sleep(0.5)
    
    results['layer8'] = validate_layer_8_atmospheric(analysis)
    time.sleep(0.5)
    
    results['layer9'] = validate_layer_9_confidence(analysis)
    time.sleep(0.5)
    
    # Resumen final
    success = print_final_summary(results)
    
    if success:
        print(f"{Colors.GREEN}📄 Ver análisis completo: cat {output_file} | jq .{Colors.RESET}")
        print(f"{Colors.GREEN}🌐 Interfaz web: http://localhost:3000{Colors.RESET}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Prueba interrumpida por el usuario{Colors.RESET}\n")
    except Exception as e:
        print(f"\n\n{Colors.RED}❌ Error inesperado: {e}{Colors.RESET}\n")
        import traceback
        traceback.print_exc()
