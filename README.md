# Exicom EV Charging Station Finder

This application helps users find EV charging stations and provides intelligent recommendations based on ML models.

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   python -m pip install -r requirements.txt
   ```
3. Create a `.env` file with necessary environment variables (see template in `.env.local`)
4. Run the application:
   ```bash
   npm run dev
   python app.py
   ```

## Model Files

The application uses several machine learning models for EV charging station recommendations. These files are not included in the repository due to their large size.

### Required Model Files

The following model files need to be downloaded separately:

- `ev_charging_model.joblib` - Main prediction model (678KB)
- `ev_charging_scaler.joblib` - Data scaling model (1.3KB)
- `trained_features.joblib` - Features used by the model (133B)

### How to Download Models

You can download the model files from our shared Google Drive:
[EV Charging Models](https://drive.google.com/drive/folders/your-folder-id)

Place the downloaded files in the root directory of the project.

### Model Training

If you wish to retrain the models, you can use the following script:

```python
python predictor.py
```

This will generate fresh model files based on the latest data in the `ev_charging_stations.csv` file.

## Technologies Used

- Frontend: React, TailwindCSS, Vite
- Backend: Python, Flask
- ML: Scikit-learn
- Data: Pandas, Parquet
- Maps: Folium, OSMnx
