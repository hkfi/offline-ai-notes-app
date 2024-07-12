from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import json

app = Flask(__name__)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

@app.route('/', methods=['GET'])
def home():
    return "Home"

@app.route('/encode', methods=['POST'])
def encode():
    data = request.get_json()
    sentences = data['sentences']
    embedding = model.encode(sentences)[0]
    content_embedding = embedding.tolist()
    return json.dumps(content_embedding)

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5001)