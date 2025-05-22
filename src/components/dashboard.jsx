'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, MapPin, Map, Check, X, AlertTriangle, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Settings, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard({ theme = 'light' }) {
  const [location, setLocation] = useState('')
  const [region, setRegion] = useState('')
  const [numPoints, setNumPoints] = useState(10)
  const [result, setResult] = useState(null)
  const [mapHtml, setMapHtml] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [openDropdowns, setOpenDropdowns] = useState({})
  const [isMapZoomed, setIsMapZoomed] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [progress, setProgress] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  const [isMobile, setIsMobile] = useState(false)

  const availableAmenities = [
    "Restaurant",
    "Cafe",
    "Fast Food",
    "Parking",
    "Bicycle Parking",
    "Mall",
    "Supermarket",
    "Hotel",
    "Station",
    "Highway Service"
  ]

  useEffect(() => {
    setSelectedAmenities(availableAmenities)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (loading) {
      const messages = [
        'Analyzing location data...',
        'Crunching numbers...',
        'Mapping optimal spots...',
        'Almost there...',
        'Finalizing results...'
      ]
      let messageIndex = 0
      const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex])
        messageIndex = (messageIndex + 1) % messages.length
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [loading])

  const analyzeLocation = async () => {
    setLoading(true)
    setError(null)
    setProgress(null)
    try {
      const response = await axios.post(`${import.meta.env.VITE_DASHBOARD_API_URL}/analyze_location`, { 
        location,
        features: selectedAmenities.map(amenity => amenity.toLowerCase().replace(' ', '_'))
      })
      if (response.data && response.data.mapHtml) {
        setResult({
          type: 'location',
          ...response.data,
          analyzedLocation: location
        })
        setMapHtml(response.data.mapHtml)
        setProgress(response.data.progress)
      } else {
        throw new Error('Invalid response data')
      }
    } catch (err) {
      setError('Error analyzing location: ' + err.message)
    }
    setLoading(false)
  }

  const analyzeRegion = async () => {
    setLoading(true)
    setError(null)
    setProgress(null)
    try {
      const response = await axios.post(`${import.meta.env.VITE_DASHBOARD_API_URL}/analyze_region`, { 
        region, 
        numPoints,
        features: selectedAmenities.map(amenity => amenity.toLowerCase().replace(' ', '_'))
      })
      if (response.data && response.data.mapHtml) {
        setResult({
          type: 'region',
          ...response.data,
          analyzedRegion: region
        })
        setMapHtml(response.data.mapHtml)
        setProgress(response.data.progress)
      } else {
        throw new Error('Invalid response data')
      }
    } catch (err) {
      setError('Error analyzing region: ' + err.message)
    }
    setLoading(false)
  }

  const downloadResults = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_DASHBOARD_API_URL}/download_results`, {
        results: result.type === 'location' ? [result] : result.results,
        location: result.type === 'location' ? result.analyzedLocation : result.analyzedRegion
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'ev_charging_locations.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Error downloading results: ' + err.message)
    }
  }

  useEffect(() => {
    if (mapHtml) {
      const mapContainer = document.getElementById('map-container')
      if (mapContainer) {
        mapContainer.innerHTML = mapHtml
      }
    }
  }, [mapHtml])

  const getProximityIcon = (proximity) => {
    switch (proximity) {
      case 'close':
        return <Check className="text-green-500" />
      case 'medium':
        return <AlertTriangle className="text-yellow-500" />
      case 'far':
        return <X className="text-red-500" />
      default:
        return <AlertCircle className="text-gray-500" />
    }
  }

  const formatProximityName = (name) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleMapZoom = () => {
    setIsMapZoomed(!isMapZoomed)
  }

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const renderLocationResults = (data) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">Suitability Score</h3>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Progress value={data.score} className="w-full rounded-full" />
        </motion.div>
        <p className="text-xs sm:text-sm mt-1 text-primary">{data.score.toFixed(2)} / 100</p>
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">Proximity Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(data.proximityRanges).map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-2 bg-secondary p-2 rounded-lg text-xs sm:text-sm"
            >
              {getProximityIcon(value)}
              <span className="text-secondary-foreground">{formatProximityName(key)}:</span>
              <span className="font-semibold text-secondary-foreground">{value}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">Coordinates</h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-secondary p-2 rounded-lg text-xs sm:text-sm text-secondary-foreground"
        >
          Latitude: {data.latitude}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-secondary p-2 rounded-lg mt-2 text-xs sm:text-sm text-secondary-foreground"
        >
          Longitude: {data.longitude}
        </motion.p>
      </div>
    </motion.div>
  )

  const renderRegionResults = (data) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">Top Locations in Region</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="rounded-tl-lg text-xs sm:text-sm text-secondary-foreground">Rank</TableHead>
              <TableHead className="text-xs sm:text-sm text-secondary-foreground">Latitude</TableHead>
              <TableHead className="text-xs sm:text-sm text-secondary-foreground">Longitude</TableHead>
              <TableHead className="text-xs sm:text-sm text-secondary-foreground">Score</TableHead>
              <TableHead className="rounded-tr-lg text-xs sm:text-sm text-secondary-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((result, index) => (
              <React.Fragment key={index}>
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-background"
                >
                  <TableCell className="text-xs sm:text-sm text-primary">{index + 1}</TableCell>
                  <TableCell className="text-xs sm:text-sm text-primary">{result.latitude.toFixed(6)}</TableCell>
                  <TableCell className="text-xs sm:text-sm text-primary">{result.longitude.toFixed(6)}</TableCell>
                  <TableCell className="text-xs sm:text-sm text-primary">{result.score.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDropdown(index)}
                      className="rounded-full p-1 sm:p-2"
                    >
                      <motion.div
                        animate={{ rotate: openDropdowns[index] ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </motion.div>
                    </Button>
                  </TableCell>
                </motion.tr>
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <Collapsible open={openDropdowns[index]}>
                      <CollapsibleContent className="p-2 sm:p-4 bg-secondary rounded-lg m-2">
                        <h4 className="font-semibold mb-2 text-xs sm:text-sm text-secondary-foreground">Proximity Analysis</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(result.proximity_ranges).map(([key, value], subIndex) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: subIndex * 0.1 }}
                              className="flex items-center space-x-2 bg-background p-2 rounded-lg text-xs sm:text-sm"
                            >
                              {getProximityIcon(value)}
                              <span className="text-primary">{formatProximityName(key)}:</span>
                              <span className="font-semibold text-primary">{value}</span>
                            </motion.div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )

  const AmenitiesSettings = () => (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableAmenities.map((amenity) => (
          <div key={amenity} className="flex items-center space-x-2">
            <Checkbox
              id={amenity}
              
              checked={selectedAmenities.includes(amenity)}
              onCheckedChange={() => handleAmenityToggle(amenity)}
            />
            <label
              htmlFor={amenity}
              className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary"
            >
              {amenity}
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'dark bg-gray-900 text-white'} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-background rounded-3xl shadow-lg overflow-hidden mx-2 sm:mx-0"
        >
          <div className="p-4 sm:p-6 md:p-8">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-primary"
            >
              EV Charging Location Analyzer
            </motion.h1>
            
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Tabs defaultValue="location" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary">
                    <TabsTrigger value="location" className="rounded-l-full text-xs sm:text-sm text-secondary-foreground">Analyze Location</TabsTrigger>
                    <TabsTrigger value="region" className="rounded-r-full text-xs sm:text-sm text-secondary-foreground">Analyze Region</TabsTrigger>
                  </TabsList>
                  <TabsContent value="location">
                    <Card className="bg-card transition-colors duration-200 rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-card-foreground">Analyze Location</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-card-foreground/70">Enter a specific location to analyze</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                          <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location"
                            className="bg-input text-xs sm:text-sm rounded-lg text-input-foreground"
                          />
                          <Button onClick={analyzeLocation} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm rounded-lg">
                            <MapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Analyze
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="region">
                    <Card className="bg-card transition-colors duration-200 rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-card-foreground">Analyze Region</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-card-foreground/70">Enter a region and number of points to analyze</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                          <Input
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Enter region"
                            className="bg-input text-xs sm:text-sm rounded-lg text-input-foreground"
                          />
                          <Input
                            type="number"
                            value={numPoints}
                            onChange={(e) => setNumPoints(parseInt(e.target.value))}
                            placeholder="Number of points"
                            className="bg-input text-xs sm:text-sm rounded-lg text-input-foreground"
                          />
                          <Button onClick={analyzeRegion} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm rounded-lg">
                            <Map className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Analyze
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {isMobile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-xs sm:text-sm rounded-lg">
                      <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Amenities Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl bg-background">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg text-primary">Amenities Settings</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm text-primary/70">
                        Select amenities to consider in the analysis.
                      </DialogDescription>
                    </DialogHeader>
                    <AmenitiesSettings />
                  </DialogContent>
                </Dialog>
              ) : (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full text-xs sm:text-sm rounded-lg">
                      <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Amenities Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-background">
                    <SheetHeader>
                      <SheetTitle className="text-base sm:text-lg text-primary">Amenities Settings</SheetTitle>
                      <SheetDescription className="text-xs sm:text-sm text-primary/70">
                        Select amenities to consider in the analysis.
                      </SheetDescription>
                    </SheetHeader>
                    <AmenitiesSettings />
                  </SheetContent>
                </Sheet>
              )}

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-card transition-colors duration-200 rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-primary"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            </div>
                          </div>
                          <motion.p
                            key={loadingMessage}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-base sm:text-lg font-semibold text-primary"
                          >
                            {loadingMessage}
                          </motion.p>
                          {progress && (
                            <div className="w-full max-w-xs">
                              <Progress value={(progress.found / progress.total) * 100} className="w-full rounded-full" />
                              <p className="text-xs sm:text-sm text-center mt-2 text-primary">
                                Analyzed {progress.found} of {progress.total} locations
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="bg-destructive border-destructive-foreground text-destructive-foreground rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm sm:text-base">Error</AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <Card className="bg-card transition-colors duration-200 rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-card-foreground">Analysis Results</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-card-foreground/70">
                          {result.type === 'location' && `Location: ${result.analyzedLocation}`}
                          {result.type === 'region' && `Region: ${result.analyzedRegion}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {result.type === 'location' && renderLocationResults(result)}
                        {result.type === 'region' && renderRegionResults(result)}
                        <Button onClick={downloadResults} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm rounded-lg">
                          <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Download Results
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card transition-colors duration-200 rounded-xl">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg sm:text-xl text-card-foreground">Map</CardTitle>
                        <Button onClick={toggleMapZoom} variant="outline" size="sm" className="text-xs sm:text-sm rounded-lg">
                          <motion.div
                            animate={{ rotate: isMapZoomed ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isMapZoomed ? <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" /> : <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </motion.div>
                        </Button>
                      </CardHeader>
                      <CardContent className={`p-0 ${isMapZoomed ? 'h-[calc(100vh-200px)]' : 'h-[300px] sm:h-[400px]'}`}>
                        <motion.div 
                          id="map-container" 
                          className="w-full h-full border rounded-lg overflow-hidden"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        ></motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}