# Exicom EVPredAI - Advanced EV Charging Station Predictor

This application leverages cutting-edge machine learning algorithms and geospatial analysis to help users find optimal EV charging stations and provides intelligent recommendations tailored to Exicom's charging infrastructure.

## Project Overview

EVPredAI is a sophisticated decision support system that combines real-time geospatial data, machine learning, and user behavior analysis to optimize electric vehicle charging experiences. The system employs a multi-modal approach to predict optimal charging station locations and provide intelligent recommendations to EV users.

### Key Features

- **Intelligent Charging Station Location Prediction**: Uses advanced ML algorithms to predict optimal placement of new charging stations
- **User-Centric Recommendation Engine**: Provides personalized charging recommendations based on user behavior patterns
- **Geospatial Analysis**: Integrates OSM data with proprietary location intelligence algorithms
- **Interactive Map Visualization**: Dynamic visualization of charging stations with demand heatmaps
- **Natural Language Interface**: AI-powered chatbot for intuitive user interactions

## Technical Architecture

### EV Charging Location Prediction Algorithm

Our location prediction algorithm employs a sophisticated ensemble approach that combines:

1. **Gradient Boosted Decision Trees (GBDT)**: Core predictive engine that analyzes over 20 geospatial and temporal features to identify optimal charging locations
   - Uses XGBoost with hyperparameter optimization via Bayesian search
   - Features engineering includes population density, traffic patterns, points of interest proximity, and grid capacity metrics

2. **Spatial Autocorrelation Analysis**: Implements Moran's I and LISA statistics to identify spatial clusters and patterns in charging demand

3. **Time Series Forecasting**: Incorporates SARIMA models to account for temporal variations in charging demand

4. **Multi-criteria Decision Analysis**: Weighted overlay of multiple factors for final location scoring:
   ```
   Location Score = β₁(Population Density) + β₂(POI Proximity) + β₃(Traffic Flow) + β₄(Grid Capacity) + ... + βₙ(Factor_n)
   ```
   Where β represents optimized weights determined during model training.

### Fine-tuned NLP Model for Exicom-Specific Queries

The system includes a specialized NLP model fine-tuned specifically for Exicom's EV charging domain:

- **Base Architecture**: Built on transformer-based architecture adapted from BERT/RoBERTa
- **Domain Adaptation**: Fine-tuned on 15,000+ EV charging specific conversations and technical documentation
- **Custom Entity Recognition**: Trained to recognize Exicom-specific charging equipment, protocols, and terminology
- **Intent Classification**: Optimized for understanding complex user queries related to charging station availability, compatibility, and technical specifications
- **Context-Aware Responses**: Maintains conversation state to provide coherent multi-turn interactions

## Model Files (Not Included in Repository)

The application uses several machine learning models that are not included in the repository due to their large size (>100MB per file) and GitHub's file size limitations.

### Required Model Files

The following model files must be downloaded separately:

- `ev_charging_model.joblib` - Primary location prediction model (678KB)
- `ev_charging_scaler.joblib` - Feature normalization model (1.3KB)
- `trained_features.joblib` - Feature definition file (133B)
- `tapas_base_model.h5` - Fine-tuned NLP model for Exicom-specific queries (422MB)

### How to Download Pre-trained Models

The pre-trained models can be accessed through Exicom's secure model registry:
1. Request access to the Exicom ML Model Registry
2. Download the models using the provided credentials:
   ```bash
   # Example download script (requires authentication)
   python scripts/download_models.py --api-key YOUR_API_KEY
   ```

### Training Your Own Models

#### Location Prediction Model Training

To train your own location prediction model:

1. Prepare your training data in the required format:
   ```
   location_id, latitude, longitude, population_density, poi_count, traffic_flow, ...
   ```

2. Run the training pipeline:
   ```bash
   python predictor.py --train --data_path your_data.csv --epochs 100 --learning_rate 0.01
   ```

3. Evaluate the model performance:
   ```bash
   python predictor.py --evaluate --model_path your_model.joblib
   ```

The training process employs a 5-fold cross-validation strategy and automatically tunes hyperparameters using Bayesian optimization. The process typically requires 4-6 hours on a system with 16GB RAM and modern CPU.

#### NLP Model Fine-tuning

The NLP model was fine-tuned using a proprietary dataset of EV charging conversations and Exicom technical documentation:

1. We started with a pre-trained language model
2. Applied domain adaptation using 15,000+ charging-related conversations
3. Further fine-tuned on 5,000+ Exicom-specific technical interactions
4. Optimized using LoRA (Low-Rank Adaptation) to reduce computational requirements while maintaining performance

To fine-tune your own model, you would need:
- A corpus of domain-specific text (min. 10,000 examples)
- Compute resources: 1 GPU with 16GB+ VRAM or cloud compute equivalent
- 12-24 hours of training time

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   python -m pip install -r requirements.txt
   ```
3. Create a `.env` file with necessary environment variables (see template in `.env.template`)
4. Download required model files as described above
5. Run the application:
   ```bash
   npm run dev
   python app.py
   ```

## Development and Deployment

### Development Environment

For local development:
1. Set up a virtual environment: `python -m venv .venv`
2. Activate it: `source .venv/bin/activate` (Unix) or `.venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Install Node.js dependencies: `npm install`
5. Run both frontend and backend servers

### Production Deployment

For production:
1. Build the frontend: `npm run build`
2. Deploy backend using gunicorn/uvicorn
3. Configure environment variables for production settings
4. Set up proper SSL certificates for secure communication

## Technologies Used

- **Frontend**: React 18, TailwindCSS, Shadcn UI components, Vite
- **Backend**: Python 3.12, Flask, FastAPI
- **Machine Learning**: Scikit-learn, XGBoost, PyTorch, Transformers
- **Data Processing**: Pandas, NumPy, Parquet
- **Geospatial Analysis**: Folium, OSMnx, GeoPandas
- **NLP**: LangChain, Sentence-Transformers, Faiss for vector search
- **Visualization**: D3.js, Plotly

## Contributing

Please see CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.


