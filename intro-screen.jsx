import React, { useState } from 'react'
import { motion } from 'framer-motion'
import App from './App'

export default function IntroScreen() {
  const [showApp, setShowApp] = useState(false)

  if (showApp) {
    return <App />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-6">Welcome to EV Charging Stations Predictor</h1>
        <p className="text-xl text-blue-100 mb-8">
          Discover optimal locations for electric vehicle charging stations
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowApp(true)}
          className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-50 transition duration-300"
        >
          Enter Application
        </motion.button>
      </motion.div>
    </div>
  )
}