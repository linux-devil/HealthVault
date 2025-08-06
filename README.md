# Medical Records Digitizer

**Powered by Gemini 3n** - A comprehensive solution for digitizing physical medical records and analyzing prescriptions with AI.

## 🏆 Competition Entry

This project is developed for the **Google - The Gemma 3n Impact Challenge** on Kaggle. It addresses the critical healthcare problem of manual medical record management and prescription confusion by leveraging Gemini 3n's multimodal capabilities.

## 🎯 Problem Statement

- **Manual Record Keeping**: Many medical records are still maintained manually, leading to confusion and potential loss of critical health information
- **Lost Records**: Patients frequently lose their physical medical documents, creating gaps in their health history
- **Prescription Confusion**: Patients often don't understand why specific medicines are prescribed, leading to poor medication adherence

## 💡 Solution

Our Medical Records Digitizer provides:

1. **Smart Digitization**: Upload images of physical medical records to extract and structure all text content using Gemini 3n's OCR capabilities
2. **Intelligent Summarization**: Generate concise, medically-relevant summaries of lengthy medical documents
3. **Prescription Analysis**: Upload prescription images to identify medicines and get clear explanations of their purposes
4. **Secure Storage**: Store digitized records in a local database for easy access and organization

## 🚀 Key Features

### Medical Record Digitization
- **Image-to-Text Conversion**: Advanced OCR using Gemini 3n to extract text from medical record images
- **Structured Data Extraction**: Organize patient information, diagnoses, treatments, medications, and dates
- **Smart Summarization**: Generate concise medical summaries highlighting key information
- **Searchable Storage**: Store and retrieve digitized records with timestamps

### Prescription Analysis
- **Medicine Identification**: Extract medicine names, dosages, frequencies, and instructions from prescription images
- **Purpose Explanation**: Provide patient-friendly explanations of why each medicine was prescribed
- **Treatment Context**: Explain how medicines work and what conditions they treat
- **Safety Information**: Include important patient considerations for each medication


###🗣️ Voice-Based Diet Logging

- **Log Meals by Speaking** : Users can speak naturally to log what they’ve eaten throughout the day (e.g., “I had poha for breakfast and two rotis with dal for lunch”)
- **Automatic Nutritional Analysis**:The app uses AI-powered transcription and food recognition to identify meals and calculate macronutrients (carbs, protein, fat) and calories
-**Personalized Diet Guidance**:Based on your daily intake, the system suggests adjustments to meet a healthy diet, tailored to your goals (e.g., weight loss, maintenance, muscle gain)


### User Interface
- **Intuitive Design**: Clean, modern interface built with React and Tailwind CSS
- **Drag-and-Drop Upload**: Easy file upload with visual feedback
- **Organized Viewing**: Separate tabs for medical records, prescriptions, and detailed views
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

### Backend
- **Python 3.11** - Core backend language
- **Flask** - Web framework with CORS support
- **Google Generative AI (Gemini 3n)** - AI model for image processing and text generation
- **SQLite** - Local database for data storage
- **PIL (Pillow)** - Image processing library

### Frontend
- **React** - Modern JavaScript framework
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide Icons** - Beautiful icon library
- **Vite** - Fast build tool and development server

### AI Integration
- **Gemini 1.5 Flash** - Multimodal AI model for:
  - Optical Character Recognition (OCR)
  - Text summarization
  - Medical content analysis
  - Prescription interpretation

## 📁 Project Structure

```
medical_records_app/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── .env                # Environment variables (API keys)
│   ├── requirements.txt    # Python dependencies
│   └── medical_records.db  # SQLite database (created automatically)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Tailwind CSS styles
│   │   └── main.jsx        # React entry point
│   ├── index.html          # HTML template
│   └── package.json        # Node.js dependencies
└── README.md               # This documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Gemini API key from Google AI Studio

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd medical_records_app/backend
   ```

2. Create and activate virtual environment:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install flask flask-cors google-generativeai python-dotenv pillow
   ```

4. Configure environment variables:
   ```bash
   # Edit .env file and add your Gemini API key
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

5. Start the backend server:
   ```bash
   python app.py
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd medical_records_app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev -- --host
   ```
   Frontend will be available on `http://localhost:5174`

## 🎮 Usage Guide

### Digitizing Medical Records
1. Click on the **"Upload Medical Record"** section
2. Drag and drop or click to select an image of your medical record
3. Wait for processing (Gemini 3n will extract and summarize the content)
4. View the digitized record in the **"Medical Records"** tab
5. Click on any record to see full details in the **"Details"** tab

### Analyzing Prescriptions
1. Click on the **"Analyze Prescription"** section
2. Upload an image of your prescription
3. The system will identify medicines and provide explanations
4. View results in the **"Prescriptions"** tab
5. Click on any prescription for detailed analysis in the **"Details"** tab

## 🔒 Privacy & Security

- **Local Processing**: All data is processed and stored locally on your device
- **No Cloud Storage**: Medical records never leave your local environment
- **HIPAA Considerations**: While Gemini API calls are made for processing, no PHI is permanently stored in the cloud
- **Offline Capability**: Once digitized, records can be accessed without internet connection

## 🌟 Gemini 3n Integration

This application leverages Gemini 3n's unique capabilities:

### Multimodal Understanding
- **Image + Text Processing**: Simultaneously processes medical images and generates structured text output
- **Context Awareness**: Understands medical terminology and context for accurate extraction

### On-Device Optimization
- **Efficient Processing**: Optimized for resource-constrained environments
- **Fast Response Times**: Quick processing of medical images and text generation

### Medical Specialization
- **Healthcare Knowledge**: Built-in understanding of medical terminology and concepts
- **Patient-Friendly Output**: Generates explanations suitable for patient understanding

## 🎯 Impact & Benefits

### For Patients
- **Never Lose Records**: Digital backup of all medical documents
- **Better Understanding**: Clear explanations of prescribed medications
- **Organized Health History**: Chronological view of medical records
- **Improved Compliance**: Better medication adherence through understanding

### For Healthcare
- **Reduced Administrative Burden**: Less time spent on record management
- **Better Patient Communication**: Patients come prepared with organized health history
- **Improved Continuity**: Complete medical history available across providers
- **Emergency Preparedness**: Critical health information always accessible

## 🚀 Future Enhancements

- **Multi-language Support**: Support for medical records in different languages
- **Voice Integration**: Audio recording and transcription of medical consultations
- **Appointment Reminders**: Integration with calendar for medication and appointment reminders
- **Health Insights**: Trend analysis and health pattern recognition
- **Provider Integration**: Direct integration with healthcare provider systems
- **Mobile App**: Native mobile applications for iOS and Android

## 📊 Technical Specifications

### API Endpoints

#### Medical Records
- `POST /api/upload-medical-record` - Upload and process medical record image
- `GET /api/medical-records` - Retrieve all medical records
- `GET /api/medical-record/<id>` - Get specific medical record details

#### Prescriptions
- `POST /api/analyze-prescription` - Upload and analyze prescription image
- `GET /api/prescriptions` - Retrieve all prescriptions
- `GET /api/prescription/<id>` - Get specific prescription analysis

### Database Schema

#### Medical Records Table
```sql
CREATE TABLE medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_text TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Prescriptions Table
```sql
CREATE TABLE prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    medicines TEXT,
    analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


## 🏥 Disclaimer

This application is designed to assist with medical record organization and medication understanding. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult with healthcare professionals for medical decisions.

---

**Built with ❤️ for the Google - The Gemma 3n Impact Challenge**

*Empowering patients with AI-driven healthcare record management*

