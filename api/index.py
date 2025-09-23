# api/index.py
from flask import Flask, request, jsonify
from sticker import generate_sticker  # your helper

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "ok", "message": "Weedsticker API running"})

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    result = generate_sticker(prompt)
    return jsonify({"result": result})

# Vercel requires 'app' to be exported
def handler(request, *args, **kwargs):
    return app(request.environ, start_response=kwargs.get("start_response"))
