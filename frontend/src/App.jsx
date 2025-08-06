import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Upload, FileText, Pill, Activity, Clock, User, BarChart3, Utensils } from 'lucide-react'
import MacroLogger from './components/MacroLogger'
import MacroChart from './components/MacroChart'
import './App.css'

const API_BASE_URL = '/api'

function App() {
  const [medicalRecords, setMedicalRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [macroEntries, setMacroEntries] = useState([])
  const [dailyStats, setDailyStats] = useState([])

  useEffect(() => {
    fetchMedicalRecords()
    fetchPrescriptions()
    fetchMacroEntries()
    fetchDailyStats()
  }, [])

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medical-records`)
      const data = await response.json()
      setMedicalRecords(data)
    } catch (error) {
      console.error('Error fetching medical records:', error)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions`)
      const data = await response.json()
      setPrescriptions(data)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    }
  }

  const fetchMacroEntries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/macro-entries`)
      const data = await response.json()
      setMacroEntries(data)
    } catch (error) {
      console.error('Error fetching macro entries:', error)
    }
  }

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/daily-macro-stats`)
      const data = await response.json()
      setDailyStats(data)
    } catch (error) {
      console.error('Error fetching daily stats:', error)
    }
  }

  const handleFileUpload = async (file, type) => {
    if (!file) return

    setLoading(true)
    
    // Check if it's a PDF file - automatically treat as medical record
    const isPDF = file.type === 'application/pdf'
    console.log('File type:', file.type, 'Is PDF:', isPDF)
    
    if (isPDF) {
      try {
        console.log('Uploading PDF:', file.name)
        // Create a sample medical record entry for PDF
        const response = await fetch(`${API_BASE_URL}/create-sample-medical-record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            fileType: 'pdf'
          })
        })
        
        console.log('Response status:', response.status)
        const data = await response.json()
        console.log('Response data:', data)
        
        if (response.ok) {
          await fetchMedicalRecords()
          await fetchPrescriptions()
          await fetchMacroEntries()
          await fetchDailyStats()
          alert('PDF uploaded and processed as medical record with sample data!')
        } else {
          alert(`Error: ${data.error}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert(`Upload failed: ${error.message}`)
      }
      setLoading(false)
      return
    }

    // Handle image files as before
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      const base64Data = e.target.result
      
      try {
        const endpoint = type === 'medical-record' ? 'upload-medical-record' : 'analyze-prescription'
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          if (type === 'medical-record') {
            fetchMedicalRecords()
          } else {
            fetchPrescriptions()
          }
          alert(data.message)
        } else {
          alert(`Error: ${data.error}`)
        }
      } catch (error) {
        alert(`Error: ${error.message}`)
      }
    }
    
    reader.readAsDataURL(file)
    setLoading(false)
  }

  const fetchRecordDetails = async (recordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/medical-record/${recordId}`)
      const data = await response.json()
      setSelectedRecord(data)
    } catch (error) {
      console.error('Error fetching record details:', error)
    }
  }

  const fetchPrescriptionDetails = async (prescriptionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prescription/${prescriptionId}`)
      const data = await response.json()
      setSelectedPrescription(data)
    } catch (error) {
      console.error('Error fetching prescription details:', error)
    }
  }

  const FileUploadSection = ({ type, title, description, icon: Icon }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, PDF up to 10MB
            </p>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e.target.files[0], type)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />
        </div>
        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const NutritionTracker = () => (
    <div className="space-y-6">
      {/* Daily Stats Summary */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Today's Nutrition Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(dailyStats[0]?.total_calories || 0)}
                </div>
                <div className="text-sm text-green-600">Calories</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(dailyStats[0]?.total_protein || 0)}g
                </div>
                <div className="text-sm text-blue-600">Protein</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-700">
                  {Math.round(dailyStats[0]?.total_carbs || 0)}g
                </div>
                <div className="text-sm text-yellow-600">Carbs</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round(dailyStats[0]?.total_fat || 0)}g
                </div>
                <div className="text-sm text-purple-600">Fat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            Your nutrition entries from uploaded documents and voice logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {macroEntries.length > 0 ? (
            <div className="space-y-4">
              {macroEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.transcribed_text}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-700">{Math.round(entry.total_calories)}</span>
                      <span className="text-gray-500 ml-1">cal</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">{Math.round(entry.total_protein)}</span>
                      <span className="text-gray-500 ml-1">g protein</span>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-700">{Math.round(entry.total_carbs)}</span>
                      <span className="text-gray-500 ml-1">g carbs</span>
                    </div>
                    <div>
                      <span className="font-medium text-purple-700">{Math.round(entry.total_fat)}</span>
                      <span className="text-gray-500 ml-1">g fat</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No nutrition entries yet</p>
              <p className="text-xs text-gray-400 mt-2">Upload a PDF in the Upload tab to see sample nutrition data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Logger */}
      <MacroLogger />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Health Vault - Your Health Companion
          </h1>
          <p className="text-lg text-gray-600">
            Powered by Gemini - Digitize medical records, analyze prescriptions, and track nutrition with AI
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="macro-logger">Nutrition Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Documents</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <FileUploadSection
                type="medical-record"
                title="Upload Medical Record"
                description="Upload images of your medical records to digitize and summarize them"
                icon={FileText}
              />
              <FileUploadSection
                type="prescription"
                title="Analyze Prescription"
                description="Upload prescription images to understand your medications"
                icon={Pill}
              />
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Medical Records</h2>
            <div className="grid gap-4">
              {medicalRecords.map((record) => (
                <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchRecordDetails(record.id)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {record.filename}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(record.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {record.summary}
                    </p>
                    {selectedRecord && selectedRecord.id === record.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div>
                          <h3 className="font-semibold mb-2">Full Medical Record</h3>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {selectedRecord.original_text}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {medicalRecords.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No medical records uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-2">Upload a PDF in the Upload tab to see medical records here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Prescriptions</h2>
            <div className="grid gap-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchPrescriptionDetails(prescription.id)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      {prescription.filename}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {prescription.medicines}
                    </p>
                    {selectedPrescription && selectedPrescription.id === prescription.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div>
                          <h3 className="font-semibold mb-2">Prescription Details</h3>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {selectedPrescription.medicines}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Medicine Analysis</h3>
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded whitespace-pre-wrap">
                            {selectedPrescription.analysis}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {prescriptions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Pill className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No prescriptions analyzed yet</p>
                    <p className="text-xs text-gray-400 mt-2">Upload a PDF in the Upload tab to see prescriptions here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="macro-logger" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nutrition Tracking</h2>
            <NutritionTracker />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}

export default App

