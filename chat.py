import pandas as pd
import numpy as np
from langchain.llms import Ollama
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict
import json
import csv
from datetime import datetime
from dotenv import load_dotenv
import os

class EVAIModel:
    def __init__(self, base_url: str = None, model_name: str = None, batch_size: int = 100):
        # Load environment variables
        load_dotenv()
        
        # Use environment variables with fallbacks
        self.ollama = Ollama(
            base_url=base_url or os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
            model=model_name or os.getenv('OLLAMA_MODEL_NAME', 'EVAI')
        )
        self.batch_size = batch_size
        self.scaler = StandardScaler()
        
        # Set up logging
        logging.basicConfig(
            filename='evai_model.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        
        # Set up feedback CSV
        self.feedback_file = 'evai_feedback.csv'
        self.setup_feedback_file()
        
    def setup_feedback_file(self):
        """Set up the feedback CSV file if it doesn't exist."""
        try:
            with open(self.feedback_file, 'x', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['timestamp', 'query', 'response', 'helpful'])
        except FileExistsError:
            pass
        
    def load_and_preprocess_data(self, csv_path: str) -> pd.DataFrame:
        """Load and preprocess the CSV data."""
        try:
            # Load the CSV file
            df = pd.read_csv(csv_path)
            
            # Basic data cleaning
            df = df.dropna()  # Remove rows with missing values
            
            # Log the data loading success
            logging.info(f"Successfully loaded data from {csv_path}")
            logging.info(f"Dataset shape: {df.shape}")
            
            return df
            
        except Exception as e:
            logging.error(f"Error loading data: {str(e)}")
            raise
    
    def process_in_batches(self, df: pd.DataFrame) -> List[Dict]:
        """Process the dataframe in batches."""
        results = []
        
        for i in range(0, len(df), self.batch_size):
            batch = df.iloc[i:i + self.batch_size]
            
            # Convert batch to a more manageable format
            batch_dict = batch.to_dict('records')
            
            # Log batch processing
            logging.info(f"Processing batch {i//self.batch_size + 1}")
            
            results.extend(batch_dict)
            
        return results
    
    def query_model(self, question: str, context: Dict = None) -> str:
        """Query the Ollama model with improved prompting and formatting."""
        try:
            # Construct a more detailed prompt
            prompt = f"""You are EVAI, an AI assistant specializing in electric vehicle (EV) information and charging stations. Your task is to provide accurate and helpful information about EV charging stations and related topics. Please follow these guidelines:

1. Structure your response using Markdown formatting.
2. Use headings (##, ###) to organize information.
3. Utilize bullet points or numbered lists for clarity.
4. If appropriate, create simple tables using Markdown syntax.
5. Bold key information using ** ** syntax.
6. If specific coordinates or a precise location are not provided, offer information about the general area or region mentioned.
7. If the question is about a large area, provide an overview of EV charging station availability and distribution in that region.
8. Include information about other EV-related needs, such as nearby amenities, payment methods, or compatibility with different EV models when relevant.
9. If you don't have enough information to answer the question fully, state what you can confidently say and suggest what additional details would be helpful.
10. Always prioritize accuracy over completeness. If you're unsure about any information, clearly state that.

Question: {question}

"""

            # If context is provided, include it in the prompt
            if context:
                prompt += f"\nContext (use only if relevant to the question):\n{json.dumps(context, indent=2)}"

            prompt += "\n\nPlease provide a clear, concise, and accurately formatted response based on the available information:"

            # Get response from model
            response = self.ollama(prompt)
            
            # Log the successful query and response
            logging.info(f"Query: {question}")
            logging.info(f"Response: {response}")
            
            return response
            
        except Exception as e:
            logging.error(f"Error in model query: {str(e)}")
            return f"An error occurred: {str(e)}"
    
    def record_feedback(self, query: str, response: str, helpful: bool):
        """Record feedback for a query-response pair."""
        with open(self.feedback_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([datetime.now(), query, response, helpful])
        
        logging.info(f"Feedback recorded: Query: {query[:50]}..., Helpful: {helpful}")
def main():
    # Initialize the model
    model = EVAIModel()
    
    # Load and preprocess the data
    csv_path = os.getenv('CSV_PATH', 'ev_charging_stations.csv')
    df = model.load_and_preprocess_data(csv_path)
    
    # Process data in batches
    processed_data = model.process_in_batches(df)
    
    # Interactive query loop
    while True:
        question = input("Ask EVAI a question (type 'exit' to quit): ")
        
        if question.lower() in ['exit', 'quit']:
            print("Exiting the conversation.")
            break
        
        # Get the most relevant context for the question
        # This is a simple implementation - you might want to add more sophisticated
        # context selection based on your specific needs
        context = processed_data[0] if processed_data else None
        
        # Get response from model
        response = model.query_model(question, context)
        
        print(f"EVAI: {response}")
        
        # Get feedback
        feedback = input("Was this response helpful? (y/n): ").lower()
        helpful = feedback == 'y'
        
        # Record feedback
        model.record_feedback(question, response, helpful)

if __name__ == "__main__":
    main()