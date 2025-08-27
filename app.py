from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# ✅ Root route
@app.route('/')
def home():
    return jsonify({"status": "Backend is running fine!"})


@app.route('/products')
def get_products():
    with open("products.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
