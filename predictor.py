from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import osmnx as ox
from opencage.geocoder import OpenCageGeocode
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import folium
import joblib
import os
import logging
import io
from shapely.geometry import Point, Polygon
import geopandas as gpd
from geopy.distance import geodesic
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class EVChargingLocationPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.all_feature_columns = [
            'restaurant', 'cafe', 'fast_food', 'parking', 
            'bicycle_parking', 'mall', 'supermarket', 'hotel', 
            'station', 'highway_service'
        ]
        # Default feature columns will be all columns initially
        self.selected_features = self.all_feature_columns.copy()
        self.trained_features = None  # Store features used during training
        self.opencage_key = 'd44d744d4ce9499bb42c8ce1a77ea1e2'
        self.geocoder = OpenCageGeocode(self.opencage_key)
        self.world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))
        self.feature_weights = {
            'restaurant': 0.15,
            'cafe': 0.1,
            'fast_food': 0.1,
            'parking': 0.15,
            'bicycle_parking': 0.05,
            'mall': 0.15,
            'supermarket': 0.1,
            'hotel': 0.1,
            'station': 0.05,
            'highway_service': 0.05
        }
    
    def set_selected_features(self, features):
        """Set custom selected features from the available features"""
        valid_features = [f for f in features if f in self.all_feature_columns]
        if not valid_features:
            raise ValueError("No valid features selected")
        self.selected_features = valid_features
        logger.info(f"Selected features set to: {self.selected_features}")
    
    def get_available_features(self):
        """Return list of all available features"""
        return self.all_feature_columns
    
    def load_model(self):
        try:
            self.model = joblib.load('ev_charging_model.joblib')
            self.scaler = joblib.load('ev_charging_scaler.joblib')
            self.trained_features = joblib.load('trained_features.joblib')
            logger.info("Model, scaler, and trained features loaded successfully.")
        except FileNotFoundError:
            logger.warning("Model files not found. Please train the model first.")
            self.model = None
            self.scaler = None
            self.trained_features = None

    def preprocess_data(self, data, for_training=False):
        """Preprocess the CSV data, handling missing values"""
        logger.info("Preprocessing data...")
        
        # Determine which features to process
        features_to_process = self.trained_features if for_training else self.selected_features
        
        # Only process available features
        available_features = [col for col in features_to_process if col in data.columns]
        max_distance = data[available_features].max().max()
        
        # Fill missing values
        data = data.fillna(max_distance)
        
        # Calculate proximity scores
        proximity_scores = data[available_features].apply(
            lambda x: np.exp(-x/1000)
        )
        
        return proximity_scores

    def calculate_suitability_score(self, proximities):
        """Calculate suitability score based on selected features"""
        # Normalize weights for selected features
        selected_weights_sum = sum(self.feature_weights[f] for f in self.selected_features)
        normalized_weights = {
            f: self.feature_weights[f]/selected_weights_sum 
            for f in self.selected_features
        }
        
        weighted_scores = []
        for feature in self.selected_features:
            if feature in proximities:
                score = proximities[feature] * normalized_weights[feature]
                weighted_scores.append(score)
        
        return sum(weighted_scores) * 100

    def train_model(self, csv_file_path):
        """Train the model using all available features"""
        try:
            logger.info("Loading and preprocessing data...")
            data = pd.read_csv(csv_file_path)
            
            # Store the features used during training
            self.trained_features = self.all_feature_columns.copy()
            
            X = self.preprocess_data(data[self.trained_features], for_training=True)
            y = X.apply(lambda row: self.calculate_suitability_score(row), axis=1)
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            logger.info("Training model...")
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X_train_scaled, y_train)
            
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            # Save the model, scaler, and trained features
            joblib.dump(self.model, 'ev_charging_model.joblib')
            joblib.dump(self.scaler, 'ev_charging_scaler.joblib')
            joblib.dump(self.trained_features, 'trained_features.joblib')
            
            importances = pd.DataFrame({
                'feature': self.trained_features,
                'importance': self.model.feature_importances_
            })
            
            return {
                "train_score": train_score,
                "test_score": test_score,
                "feature_importances": importances.to_dict(orient='records')
            }
            
        except Exception as e:
            logger.error(f"Error during training: {e}")
            raise

    def predict_suitability(self, lat, lon):
        """Predict suitability score using selected features"""
        if self.model is None or self.scaler is None:
            self.load_model()
        
        if self.model is None or self.scaler is None:
            return None, None
        
        if not self.is_on_land(lat, lon):
            return None, None
        
        # Get distances for all trained features
        distances = self.get_amenities_distances(lat, lon)
        
        # Create DataFrame with all trained features
        df = pd.DataFrame([distances])
        
        # Preprocess using all trained features
        X = self.preprocess_data(df[self.trained_features], for_training=True)
        X_scaled = self.scaler.transform(X)
        
        # Get base prediction
        base_score = self.model.predict(X_scaled)[0]
        
        # Calculate adjustment factor based on selected features
        if set(self.selected_features) != set(self.trained_features):
            selected_weight_sum = sum(self.feature_weights[f] for f in self.selected_features)
            total_weight_sum = sum(self.feature_weights[f] for f in self.trained_features)
            adjustment_factor = selected_weight_sum / total_weight_sum
            final_score = base_score * adjustment_factor
        else:
            final_score = base_score
        
        # Return only the distances for selected features
        selected_distances = {k: v for k, v in distances.items() if k in self.selected_features}
        
        return final_score, selected_distances

    def get_amenities_distances(self, lat, lon, radius=2500):
        """Get distances to nearest amenities using OSMnx"""
        distances = {}
        
        for feature in self.trained_features:  # Get distances for all trained features
            try:
                if feature in ['mall', 'supermarket']:
                    category = 'shop'
                elif feature in ['hotel']:
                    category = 'tourism'
                elif feature in ['station']:
                    category = 'public_transport'
                elif feature == 'highway_service':
                    category = 'highway'
                else:
                    category = 'amenity'
                
                tags = {category: feature}
                amenities = ox.features.features_from_point(
                    (lat, lon), 
                    tags=tags, 
                    dist=radius
                )
                
                if not amenities.empty:
                    min_distance = float('inf')
                    for _, row in amenities.iterrows():
                        point = row.geometry.centroid if hasattr(row.geometry, 'centroid') else row.geometry
                        distance = ox.distance.great_circle(lat, lon, point.y, point.x)
                        min_distance = min(min_distance, distance)
                    distances[feature] = min_distance
                else:
                    distances[feature] = radius
                    
            except Exception as e:
                logger.error(f"Error getting {feature}: {e}")
                distances[feature] = radius
        
        return distances

    def is_on_land(self, lat, lon):
        """Check if a given point is on land"""
        point = gpd.GeoDataFrame(geometry=[Point(lon, lat)], crs="EPSG:4326")
        return self.world.contains(point.iloc[0].geometry).any()

    def get_location_coordinates(self, location_name):
        """Get coordinates for a location name"""
        try:
            result = self.geocoder.geocode(location_name)
            if result:
                return result[0]['geometry']['lat'], result[0]['geometry']['lng']
            else:
                logger.warning(f"Could not find coordinates for {location_name}")
                return None
        except Exception as e:
            logger.error(f"Error during geocoding: {e}")
            raise

    def get_proximity_ranges(self, distances):
        """Calculate proximity ranges for amenities"""
        ranges = {
            'close': 500,
            'medium': 1000,
            'far': 2500
        }
        
        proximity_ranges = {}
        for feature, distance in distances.items():
            if distance <= ranges['close']:
                proximity_ranges[feature] = 'close'
            elif distance <= ranges['medium']:
                proximity_ranges[feature] = 'medium'
            elif distance <= ranges['far']:
                proximity_ranges[feature] = 'far'
            else:
                proximity_ranges[feature] = 'not found'
        
        return proximity_ranges

    def generate_map(self, lat, lon, score, proximity_ranges):
        """Generate a map with the location marker and proximity ranges"""
        m = folium.Map(location=[lat, lon], zoom_start=13)
        
        folium.Marker(
            [lat, lon],
            popup=f"Suitability Score: {score:.2f}",
            tooltip="Analyzed Location"
        ).add_to(m)
        
        for feature, proximity in proximity_ranges.items():
            if feature in self.selected_features:  # Only show selected features
                color = {
                    'close': 'rgba(0, 255, 0, 0.3)',
                    'medium': 'rgba(255, 165, 0, 0.3)',
                    'far': 'rgba(255, 0, 0, 0.3)',
                    'not found': 'rgba(128, 128, 128, 0.3)'
                }[proximity]
                
                radius = {
                    'close': 500,
                    'medium': 1000,
                    'far': 2500,
                    'not found': 0
                }[proximity]
                
                folium.CircleMarker(
                    [lat, lon],
                    radius=5,
                    popup=f"{feature.capitalize()}: {proximity}",
                    color=color,
                    fill=True
                ).add_to(m)
                
                if radius > 0:
                    folium.Circle(
                        [lat, lon],
                        radius=radius,
                        color=color,
                        fill=True,
                        fillColor=color,
                        fillOpacity=0.2
                    ).add_to(m)
        
        return m

    def analyze_region(self, region_name, num_points=10, min_distance_km=3):
        """Analyze multiple locations within a region"""
        try:
            result = self.geocoder.geocode(region_name, limit=1)
            if not result:
                logger.warning(f"Could not find region: {region_name}")
                return None, None
            
            bbox = result[0]['bounds']
            min_lat, min_lon = bbox['southwest']['lat'], bbox['southwest']['lng']
            max_lat, max_lon = bbox['northeast']['lat'], bbox['northeast']['lng']
            
            results = []
            attempts = 0
            max_attempts = num_points * 10
            
            while len(results) < num_points and attempts < max_attempts:
                lat = np.random.uniform(min_lat, max_lat)
                lon = np.random.uniform(min_lon, max_lon)
                
                if self.is_on_land(lat, lon):
                    if all(geodesic((lat, lon), (r['latitude'], r['longitude'])).km >= min_distance_km 
                          for r in results):
                        score, distances = self.predict_suitability(lat, lon)
                        if score is not None:
                            proximity_ranges = self.get_proximity_ranges(distances)
                            results.append({
                                'latitude': lat,
                                'longitude': lon,
                                'score': score,
                                'distances': distances,
                                'proximity_ranges': proximity_ranges
                            })
                
                attempts += 1
            
            results.sort(key=lambda x: x['score'], reverse=True)
            
            m = self.create_region_visualization(results, region_name)
            
            return results, m
        
        except Exception as e:
            logger.error(f"Error during region analysis: {e}")
            raise

    def create_region_visualization(self, results, region_name):
        """Create an interactive map visualization for multiple locations"""
        if not results:
            return None
        
        lats = [r['latitude'] for r in results]
        lons = [r['longitude'] for r in results]
        center_lat = sum(lats) / len(lats)
        center_lon = sum(lons) / len(lons)
        
        m = folium.Map(location=[center_lat, center_lon], zoom_start=10)
        
        for result in results:
            lat, lon = result['latitude'], result['longitude']
            score = result['score']
            
            popup_content = f"Suitability Score: {score:.1f}%<br>"
            for feature, prox_range in result['proximity_ranges'].items():
                if feature in self.selected_features:  # Only show selected features
                    popup_content += f"{feature}: {prox_range}<br>"
            
            folium.Marker(
                location=[lat, lon],
                popup=folium.Popup(popup_content, max_width=300),
                icon=folium.Icon(color='red', icon='info-sign')
            ).add_to(m)
            
            # Add circular areas for each proximity range
            for feature, prox_range in result['proximity_ranges'].items():
                if feature in self.selected_features:  # Only show selected features
                    color = {
                        'close': 'rgba(0, 255, 0, 0.3)',
                        'medium': 'rgba(255, 165, 0, 0.3)',
                        'far': 'rgba(255, 0, 0, 0.3)',
                        'not found': 'rgba(128, 128, 128, 0.3)'
                    }[prox_range]
                    
                    radius = {
                        'close': 500,
                        'medium': 1000,
                        'far': 2500,
                        'not found': 0
                    }[prox_range]
                    
                    if radius > 0:
                        folium.Circle(
                            [lat, lon],
                            radius=radius,
                            color=color,
                            fill=True,
                            fillColor=color,
                            fillOpacity=0.2,
                            popup=f"{feature.capitalize()}: {prox_range}"
                        ).add_to(m)
        
        return m

    def get_map_html(self, map_obj):
        """Get the HTML content of the map"""
        return map_obj._repr_html_() if map_obj else ""

    def analyze_large_area(self, location_name, num_points=50, min_distance_km=5):
        """Analyze a large area by sampling multiple points"""
        try:
            result = self.geocoder.geocode(location_name, limit=1)
            if not result:
                logger.warning(f"Could not find location: {location_name}")
                return None, None, None
            
            bbox = result[0]['bounds']
            min_lat, min_lon = bbox['southwest']['lat'], bbox['southwest']['lng']
            max_lat, max_lon = bbox['northeast']['lat'], bbox['northeast']['lng']
            
            results = []
            attempts = 0
            max_attempts = num_points * 10
            
            while len(results) < num_points and attempts < max_attempts:
                lat = np.random.uniform(min_lat, max_lat)
                lon = np.random.uniform(min_lon, max_lon)
                
                if self.is_on_land(lat, lon):
                    if all(geodesic((lat, lon), (r['latitude'], r['longitude'])).km >= min_distance_km 
                          for r in results):
                        score, distances = self.predict_suitability(lat, lon)
                        if score is not None:
                            proximity_ranges = self.get_proximity_ranges(distances)
                            results.append({
                                'latitude': lat,
                                'longitude': lon,
                                'score': score,
                                'distances': distances,
                                'proximity_ranges': proximity_ranges
                            })
                
                attempts += 1
            
            if not results:
                logger.warning(f"Could not find any suitable locations in {location_name}")
                return None, None, None
            
            best_location = max(results, key=lambda x: x['score'])
            
            m = self.generate_map(
                best_location['latitude'],
                best_location['longitude'],
                best_location['score'],
                best_location['proximity_ranges']
            )
            
            return best_location, results, m
        
        except Exception as e:
            logger.error(f"Error during large area analysis: {e}")
            raise

    def create_csv_from_results(self, results, location_name=None):
        """Create a CSV file from analysis results"""
        rows = []
        for result in results:
            row = {
                'Location': location_name if location_name else 'Unknown',
                'Latitude': result['latitude'],
                'Longitude': result['longitude'],
                'Suitability_Score': result['score']
            }
            
            # Add distances for each feature
            for feature, distance in result['distances'].items():
                row[f'{feature}_distance'] = distance
            
            # Add proximity ranges for each feature
            for feature, prox_range in result['proximity_ranges'].items():
                row[f'{feature}_proximity'] = prox_range
            
            rows.append(row)
        
        df = pd.DataFrame(rows)
        return df

# Initialize the predictor
predictor = EVChargingLocationPredictor()

@app.route('/get_available_features', methods=['GET'])
def get_available_features():
    """Return list of all available features"""
    try:
        features = predictor.get_available_features()
        return jsonify({"features": features})
    except Exception as e:
        logger.error(f"Error in get_available_features route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/set_features', methods=['POST'])
def set_features():
    """Set custom selected features"""
    try:
        features = request.json.get('features', [])
        if not features:
            return jsonify({"error": "No features provided"}), 400
        
        predictor.set_selected_features(features)
        return jsonify({
            "message": "Features updated successfully", 
            "selected_features": features
        })
    except Exception as e:
        logger.error(f"Error in set_features route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/download_results', methods=['POST'])
def download_results():
    """Download analysis results as CSV"""
    try:
        results = request.json.get('results', [])
        location = request.json.get('location', None)
        
        if not results:
            return jsonify({"error": "No results provided"}), 400
        
        df = predictor.create_csv_from_results(results, location)
        
        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        
        # Create response
        output.seek(0)
        filename = f"ev_charging_locations_{location.replace(' ', '_')}.csv" if location else "ev_charging_locations.csv"
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error in download_results route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload_and_train', methods=['POST'])
def upload_and_train():
    """Upload training data and train the model"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        try:
            result = predictor.train_model(filepath)
            return jsonify({
                "message": "File uploaded and model trained successfully",
                "result": result,
                "trained_features": predictor.trained_features
            })
        except Exception as e:
            logger.error(f"Error in upload_and_train route: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route('/analyze_location', methods=['POST'])
def analyze_location():
    """Analyze a specific location"""
    try:
        location = request.json['location']
        # Get selected features from request if provided
        features = request.json.get('features', None)
        if features:
            predictor.set_selected_features(features)
        
        # Check if the location is potentially a large area
        result = predictor.geocoder.geocode(location, limit=1)
        if result and 'components' in result[0]:
            components = result[0]['components']
            is_large_area = any(key in components for key in ['state', 'county', 'city'])
        else:
            is_large_area = False
        
        if is_large_area:
            best_location, all_results, m = predictor.analyze_large_area(location)
            
            if best_location is None:
                return jsonify({"error": "Unable to analyze this location."}), 400
            
            map_html = predictor.get_map_html(m)
            
            return jsonify({
                "location": location,
                "latitude": best_location['latitude'],
                "longitude": best_location['longitude'],
                "score": best_location['score'],
                "distances": best_location['distances'],
                "proximityRanges": best_location['proximity_ranges'],
                "mapHtml": map_html,
                "allResults": all_results,
                "selectedFeatures": predictor.selected_features
            })
        else:
            coordinates = predictor.get_location_coordinates(location)
            
            if coordinates:
                lat, lon = coordinates
                if not predictor.is_on_land(lat, lon):
                    return jsonify({
                        "error": "The specified location is on water. Please choose a land location."
                    }), 400
                
                score, distances = predictor.predict_suitability(lat, lon)
                if score is None:
                    return jsonify({
                        "error": "Unable to predict suitability for this location."
                    }), 400
                
                proximity_ranges = predictor.get_proximity_ranges(distances)
                
                m = predictor.generate_map(lat, lon, score, proximity_ranges)
                map_html = predictor.get_map_html(m)
                
                return jsonify({
                    "location": location,
                    "latitude": lat,
                    "longitude": lon,
                    "score": score,
                    "distances": distances,
                    "proximityRanges": proximity_ranges,
                    "mapHtml": map_html,
                    "selectedFeatures": predictor.selected_features
                })
            else:
                return jsonify({
                    "error": "Could not analyze location due to geocoding error."
                }), 400
    except Exception as e:
        logger.error(f"Error in analyze_location route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze_region', methods=['POST'])
def analyze_region():
    """Analyze a region with multiple points"""
    try:
        region = request.json['region']
        num_points = request.json.get('numPoints', 10)
        min_distance_km = request.json.get('minDistanceKm', 3)
        
        # Get selected features from request if provided
        features = request.json.get('features', None)
        if features:
            predictor.set_selected_features(features)
        
        results, m = predictor.analyze_region(region, num_points, min_distance_km)
        
        if results:
            map_html = predictor.get_map_html(m)
            
            return jsonify({
                "results": results,
                "mapHtml": map_html,
                "selectedFeatures": predictor.selected_features
            })
        else:
            return jsonify({"error": "Could not analyze region."}), 400
    except Exception as e:
        logger.error(f"Error in analyze_region route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)