import os
import requests
import base64
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

sticker_bp = Blueprint('sticker', __name__)

@sticker_bp.route('/generate-sticker', methods=['POST'])
def generate_sticker():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            return jsonify({'error': 'API key not configured'}), 500
        
        # Enhance the prompt for better sticker generation
        full_prompt = f"{prompt}, high quality, vector illustration, die-cut sticker with a white border"
        
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
                    # Rate limit - wait and retry
                    if attempt < retries - 1:
                        import time
                        time.sleep(2 ** attempt)  # Exponential backoff
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

@sticker_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'sticker-generator'})
