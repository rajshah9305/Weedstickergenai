import os
import sys
import requests
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import random

load_dotenv()

app = Flask(__name__, static_folder='../static')
CORS(app)

# Cannabis sticker prompts
STICKER_PROMPTS = [
    "Kawaii cannabis leaf with sparkly eyes and a big smile, pastel colors",
    "Retro 70s cannabis leaf with groovy patterns and rainbow colors, vintage style",
    "Minimalist geometric cannabis leaf in neon green, clean vector art",
    "Cannabis leaf wearing sunglasses with a chill expression",
    "Mandala-style cannabis leaf with intricate patterns, zen design",
    "Cannabis leaf as a superhero with cape flying, comic book style",
    "Watercolor cannabis leaf with dreamy purple and green gradients",
    "Cannabis leaf playing guitar with musical notes around it",
    "Pixel art cannabis leaf, 8-bit retro gaming style",
    "Cannabis leaf with angel wings and halo, peaceful design",
    "Tribal tattoo style cannabis leaf with bold black lines",
    "Cannabis leaf wearing a beanie hat, street art graffiti style",
    "Holographic cannabis leaf with rainbow prism effects",
    "Cannabis leaf with butterfly wings, nature-inspired magical",
    "Cannabis leaf as a yoga pose silhouette, meditation theme",
    "Steampunk cannabis leaf with gears and brass accents",
    "Cannabis leaf made of galaxy stars and nebula, cosmic theme",
    "Cannabis leaf with crown, royal and majestic golden design",
    "Cannabis leaf surfing on a wave, California beach vibe",
    "Cannabis leaf with third eye symbol, spiritual theme"
]

@app.route('/api/generate-sticker', methods=['POST'])
def generate_sticker():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            # If no prompt provided, use a random one
            prompt = random.choice(STICKER_PROMPTS)
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({'error': 'API key not configured'}), 500
        
        # Enhance the prompt for better sticker generation
        full_prompt = f"{prompt}, high quality, vector illustration, die-cut sticker with a white border, clean background"
        
        # Gemini API endpoint for Imagen 4
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages?key={api_key}"
        
        payload = {
            "instances": [{"prompt": full_prompt}],
            "parameters": {"sampleCount": 1}
        }
        
        # Make API request with retries
        retries = 3
        for attempt in range(retries):
            try:
                response = requests.post(
                    api_url,
                    headers={'Content-Type': 'application/json'},
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if (result.get('predictions') and 
                        len(result['predictions']) > 0 and 
                        result['predictions'][0].get('bytesBase64Encoded')):
                        
                        image_data = result['predictions'][0]['bytesBase64Encoded']
                        return jsonify({
                            'success': True,
                            'image': f"data:image/png;base64,{image_data}",
                            'prompt': prompt
                        })
                    else:
                        return jsonify({'error': 'Invalid response structure from API'}), 500
                        
                elif response.status_code == 429:
                    if attempt < retries - 1:
                        import time
                        time.sleep(2 ** attempt)
                        continue
                    else:
                        return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
                        
                else:
                    return jsonify({'error': f'API request failed with status {response.status_code}'}), 500
                    
            except requests.exceptions.Timeout:
                if attempt < retries - 1:
                    continue
                else:
                    return jsonify({'error': 'Request timeout. Please try again.'}), 500
                    
            except requests.exceptions.RequestException as e:
                if attempt < retries - 1:
                    continue
                else:
                    return jsonify({'error': f'Network error: {str(e)}'}), 500
        
        return jsonify({'error': 'Failed to generate image after multiple attempts'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/random-prompt', methods=['GET'])
def get_random_prompt():
    """Get a random sticker prompt"""
    try:
        prompt = random.choice(STICKER_PROMPTS)
        return jsonify({'prompt': prompt, 'success': True})
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'weed-sticker-generator'})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Serve index.html for SPA routing
        return send_from_directory(app.static_folder, 'index.html')

# For Vercel
app = app
