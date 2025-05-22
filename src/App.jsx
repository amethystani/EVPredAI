'use client'

import React, { useState, useEffect } from "react"
import { Menu, X, Sun, Moon, Battery, Zap, ArrowRight, Upload, Loader2, Info, MapPin, ChevronRight, Home, Phone, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Dashboard from "./components/Dashboard"
import Chatbot from "./components/Chatbot"
import { BorderTrail } from './components/border-trail'

const TrainingResults = ({ results, theme }) => (
  <div className={`mt-8 p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
    <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-300">Training Results</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg font-semibold mb-2">Model Performance</h4>
        <p className="mb-2">
          R² Training Score: <span className="font-bold text-green-500">{(results.train_score * 100).toFixed(2)}%</span>
        </p>
        <p className="mb-4">
          R² Test Score: <span className="font-bold text-green-500">{(results.test_score * 100).toFixed(2)}%</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          An R² score close to 100% indicates that the model explains a large portion of the variability in the data.
        </p>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-2">Feature Importance</h4>
        <div className="space-y-2">
          {results.feature_importances.sort((a, b) => b.importance - a.importance).map((feature, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{feature.feature}</span>
                <span>{(feature.importance * 100).toFixed(2)}%</span>
              </div>
              <Progress value={feature.importance * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const CSVInfoPopover = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="icon" className="ml-2">
        <Info className="h-4 w-4" />
        <span className="sr-only">CSV file format info</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[400px] max-w-[calc(100vw-2rem)]" align="end" side="left">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">CSV File Format</h4>
          <p className="text-sm text-muted-foreground">
            Your CSV should include the following columns:
          </p>
        </div>
        <div className="bg-muted p-2 rounded-md">
          <code className="text-xs break-all">
            station_lat,station_lon,restaurant,cafe,fast_food,parking,bicycle_parking,mall,supermarket,hotel,station,highway_service
          </code>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Example row:</p>
          <div className="bg-muted p-2 rounded-md mt-1">
            <code className="text-xs break-all">
              28.555381,77.228418,463.28,461.26,738.77,285.61,2114.25,1006.96,515.5,854.81,1151.68,248
            </code>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)

const FeatureBox = ({ icon, title, description, theme }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
        <div className="text-blue-500 dark:text-blue-300 mb-4 md:mb-0 md:mr-6 flex-shrink-0">{icon}</div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
      {isHovered && (
        <BorderTrail
          className="bg-gradient-to-l from-blue-200 via-blue-500 to-blue-200 dark:from-blue-400 dark:via-blue-500 dark:to-blue-700"
          size={120}
        />
      )}
    </div>
  )
}

const WelcomeScreen = ({ onGetStarted, theme }) => {
  const features = [
    { 
      icon: <MapPin size={48} />, 
      title: "Predicting New and Optimal Locations", 
      description: "Utilize advanced algorithms to identify the best locations for new EV charging points based on various factors such as traffic patterns, population density, and existing infrastructure."
    },
    { 
      icon: <Zap size={48} />, 
      title: "EVAI - AI for EV Charging Needs", 
      description: "Our EVAI system uses machine learning to predict and optimize EV charging needs, helping both drivers and charging station operators make informed decisions."
    },
    { 
      icon: <Upload size={48} />, 
      title: "Custom CSV Prediction Model", 
      description: "Train our prediction model using your own CSV file, allowing for customized and localized predictions based on your specific data and requirements."
    }
  ]

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden rounded-3xl mb-12">
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-3xl"
          style={{backgroundImage: "url('/image.png?height=1080&width=1920')"}}
        ></div>
        <div 
          className="absolute inset-0 opacity-30 rounded-3xl"
          style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')",
            backgroundRepeat: 'repeat'
          }}
        ></div>
        
        <div className="text-center relative z-10 max-w-2xl mx-auto px-4 py-8 bg-white bg-opacity-10 backdrop-blur-md rounded-3xl">
          <h1 className="text-5xl font-bold mb-6 text-white">
            Welcome to EV Charging Stations Predictor
          </h1>
          <p className="text-xl mb-8 text-white">
            Discover optimal locations for electric vehicle charging stations using our advanced AI-powered prediction system
          </p>
          <Button
            onClick={onGetStarted}
            className="bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 flex items-center justify-center mx-auto text-lg"
          >
            Get Started
            <ArrowRight className="ml-2" size={24} />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 mb-32">
        <div className="space-y-12">
          {features.map((feature, index) => (
            <FeatureBox key={index} {...feature} theme={theme} />
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Optimize Your EV Charging Network?</h2>
          <p className="text-xl text-white mb-8">Start using our advanced prediction tools today and revolutionize your approach to EV charging infrastructure.</p>
          <Button
            onClick={onGetStarted}
            className="bg-white text-blue-600 hover:bg-blue-100 font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 flex items-center justify-center mx-auto text-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2" size={24} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Component() {
  const [currentView, setCurrentView] = useState('welcome')
  const [theme, setTheme] = useState('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [trainingResults, setTrainingResults] = useState(null)
  const [notification, setNotification] = useState(null)
  const [aboutSection, setAboutSection] = useState('main')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev)
    setAboutSection('main')
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setIsUploading(true)
      setUploadProgress(0)
      const formData = new FormData()
      formData.append('file', file)

      try {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 500))
          setUploadProgress(i)
        }

        const response = await fetch('http://localhost:8080/upload_and_train', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const result = await response.json()
        setTrainingResults(result.result)
        showNotification("File uploaded and model trained successfully", "success")
      } catch (error) {
        console.error('Error:', error)
        showNotification("Failed to upload file and train model", "error")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const renderPredictionModel = () => (
    <div className="container mx-auto px-4 py-8">
      <Card className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} transition-colors duration-200`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-600 dark:text-blue-300">Train Prediction Model</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">Upload a CSV file to train the model</CardDescription>
            </div>
            <CSVInfoPopover />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <AnimatePresence mode="wait">
                {isUploading ? (
                  <div>
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 text-blue-500" />
                  </div>
                )}
              
              </AnimatePresence>
              
              <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {isUploading ? 'Uploading...' : 'Click to upload CSV'}
              </span>
            </label>
          </div>
          <AnimatePresence>
            {isUploading && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </AnimatePresence>
          {trainingResults && <TrainingResults results={trainingResults} theme={theme} />}
        </CardContent>
      </Card>
    </div>
  )

  const renderAboutSection = () => {
    const buttonClass = "text-left py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center justify-between w-full"
    
    switch (aboutSection) {
      case 'main':
        return (
          <>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>About EV Charging Predictor</h2>
            <p className={`mb-4 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              EV Charging Predictor is an innovative tool designed to help predict optimal locations for new EV charging stations.
            </p>
            <div className="space-y-2">
              <button onClick={() => setAboutSection('features')} className={buttonClass}>
                Features <ChevronRight size={16} />
              </button>
              <button onClick={() => setAboutSection('team')} className={buttonClass}>
                Our Team <ChevronRight size={16} />
              </button>
              <button onClick={() => setAboutSection('contact')} className={buttonClass}>
                Contact Us <ChevronRight size={16} />
              </button>
            </div>
          </>
        )
      case 'features':
        return (
          <>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Key Features</h3>
            <ul className={`list-disc list-inside mb-4 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              <li>Predicting optimal locations</li>
              <li>EVAI - AI-powered system</li>
              <li>Custom CSV file upload</li>
              <li>Data-driven insights</li>
            </ul>
            <button onClick={() => setAboutSection('main')} className={buttonClass}>
              <ChevronRight size={16} className="transform rotate-180" /> Back
            </button>
          </>
        )
      case 'team':
        return (
          <>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Our Team</h3>
            <p className={`mb-4 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Our team consists of experts in AI, data science, and EV infrastructure.
            </p>
            <button onClick={() => setAboutSection('main')} className={buttonClass}>
              <ChevronRight size={16} className="transform rotate-180" /> Back
            </button>
          </>
        )
      case 'contact':
        return (
          <>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Contact Us</h3>
            <p className={`mb-4 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Email: info@evchargingpredictor.com<br />
              Phone: +1 (555) 123-4567
            </p>
            <button onClick={() => setAboutSection('main')} className={buttonClass}>
              <ChevronRight size={16} className="transform rotate-180" /> Back
            </button>
          </>
        )
      default:
        return null
    }
  }

  const menuItems = [
    { title: 'Home', icon: <Home size={20} />, onClick: () => setCurrentView('welcome') },
    { title: 'Analyze Locations', icon: <Zap size={20} />, onClick: () => setCurrentView('dashboard') },
    { title: 'Prediction Model', icon: <Battery size={20} />, onClick: () => setCurrentView('predictionModel') },
    { title: 'Contact', icon: <Phone size={20} />, onClick: () => setAboutSection('contact') },
    { title: 'About', icon: <Info size={20} />, onClick: () => setAboutSection('main') },
  ]

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100 text-black' : 'bg-gray-900 text-white'}`}>
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
      <header className={`${theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-800 to-gray-900'} text-white py-4 shadow-lg fixed top-0 left-0 right-0 z-40`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src="/Exicom Logo.svg"
                alt="Exicom Logo"
                className="h-10 w-auto object-contain"
              />
              <div>
                <p className="text-sm text-blue-200">EV Charging Stations Predictor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors duration-200"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={toggleMenu}
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors duration-200"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className={`flex-grow overflow-y-auto pt-20 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <WelcomeScreen onGetStarted={() => setCurrentView('dashboard')} theme={theme} />
            </motion.div>
          )}
          {currentView === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard theme={theme} />
            </motion.div>
          )}
          {currentView === 'predictionModel' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {renderPredictionModel()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 right-4 z-50 w-64 p-4 rounded-lg shadow-lg ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}
          >
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick()
                    setIsMenuOpen(false)
                  }}
                  className={`w-full text-left py-2 px-4 rounded-lg transition-colors duration-200 ${
                    theme === 'light'
                      ? 'hover:bg-blue-100 text-gray-800'
                      : 'hover:bg-blue-900 text-white'
                  } flex items-center space-x-2`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
            {aboutSection !== 'main' && renderAboutSection()}
          </motion.div>
        )}
      </AnimatePresence>
      <footer className={`py-4 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
        <div className="container mx-auto px-4 text-center">
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            2024 EV Charging Stations Predictor.
          </p>
        </div>
      </footer>
      <Chatbot />
    </div>
  )
}