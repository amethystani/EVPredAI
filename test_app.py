import unittest
import json
from chatbot import app

class TestEVChargingPredictor(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_predict_missing_parameters(self):
        response = self.app.post('/predict', 
                                 data=json.dumps({'city': 'New York'}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_predict_valid_input(self):
        response = self.app.post('/predict', 
                                 data=json.dumps({
                                     'city': 'New York',
                                     'radius': '10',
                                     'chargerType': 'level-2'
                                 }),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('predictions', data)
        self.assertTrue(len(data['predictions']) > 0)
        self.assertIn('id', data['predictions'][0])
        self.assertIn('name', data['predictions'][0])
        self.assertIn('score', data['predictions'][0])

if __name__ == '__main__':
    unittest.main()