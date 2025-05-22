from flask import Flask, request, jsonify
from flask_cors import CORS
from chat import EVAIModel
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize the EVAI model
model = EVAIModel()

# Load and preprocess the data
csv_path = os.getenv('CSV_PATH', 'ev_charging_stations.csv')
df = model.load_and_preprocess_data(csv_path)

# Process data in batches
processed_data = model.process_in_batches(df)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data['query']
    context = processed_data[0] if processed_data else None
    
    # Get response from model
    response = model.query_model(query, context)
    
    return jsonify({'response': response})

@app.route('/feedback', methods=['POST'])
def feedback():
    data = request.json
    query = data['query']
    response = data['response']
    helpful = data['helpful']
    
    # Record feedback
    model.record_feedback(query, response, helpful)
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 8000))
    app.run(debug=True, port=port, host='0.0.0.0')   # Changed port to 8000