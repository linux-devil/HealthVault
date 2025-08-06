# Setup Instructions for Medical Records Digitizer

## Quick Start Guide

### 1. Prerequisites
Before running the application, ensure you have:
- Python 3.11 or higher
- Node.js 20.x or higher
- A Gemini API key from Google AI Studio

### 2. Get Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for use in step 4

### 3. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd medical_records_app

# Or extract the downloaded ZIP file
unzip medical_records_app.zip
cd medical_records_app
```

### 4. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install flask flask-cors google-generativeai python-dotenv pillow

# Configure API key
# Edit the .env file and replace 'your_gemini_api_key_here' with your actual API key
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

### 5. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install
```

### 6. Start the Application
You need to run both backend and frontend servers:

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```
Backend will run on: http://localhost:5000

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- --host
```
Frontend will run on: http://localhost:5174 (or another port if 5174 is busy)

### 7. Access the Application
Open your web browser and navigate to the frontend URL (typically http://localhost:5174)

## Troubleshooting

### Common Issues

#### 1. "Port already in use" error
If you get a port conflict:
```bash
# Kill processes using the ports
sudo lsof -ti:5000 | xargs sudo kill -9  # For backend
sudo lsof -ti:5174 | xargs sudo kill -9  # For frontend
```

#### 2. "Module not found" errors
Make sure you activated the virtual environment:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3. API key issues
- Ensure your Gemini API key is correctly set in `backend/.env`
- Verify the API key is valid and has appropriate permissions
- Check that there are no extra spaces or quotes around the API key

#### 4. CORS errors in browser
The backend is configured with CORS enabled. If you still see CORS errors:
- Make sure both servers are running
- Check that the frontend is making requests to the correct backend URL (http://localhost:5000)

### Testing the Setup

1. **Backend Test**: Visit http://localhost:5000/api/medical-records in your browser
   - You should see an empty JSON array: `[]`

2. **Frontend Test**: Visit the frontend URL
   - You should see the Medical Records Digitizer interface

3. **Full Integration Test**: 
   - Try uploading a sample medical record image
   - Check if the processing works and data is stored

## Development Notes

### File Structure
```
medical_records_app/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── .env                # Environment variables (API keys)
│   ├── venv/               # Python virtual environment
│   └── medical_records.db  # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   └── App.css         # Styles
│   ├── node_modules/       # Node.js dependencies
│   └── package.json        # Frontend dependencies
└── README.md
```

### Database
- SQLite database is automatically created when you first run the backend
- Database file: `backend/medical_records.db`
- No manual database setup required

### API Endpoints
- `POST /api/upload-medical-record` - Upload medical record image
- `GET /api/medical-records` - Get all medical records
- `GET /api/medical-record/<id>` - Get specific record
- `POST /api/analyze-prescription` - Analyze prescription image
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescription/<id>` - Get specific prescription

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use proper environment variable management
2. **Database**: Migrate from SQLite to PostgreSQL or MySQL for better performance
3. **Security**: Implement proper authentication and authorization
4. **HTTPS**: Use SSL certificates for secure communication
5. **Process Management**: Use PM2 or similar for process management
6. **Reverse Proxy**: Use Nginx or Apache as a reverse proxy

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure API keys are correctly configured
4. Check browser console for JavaScript errors
5. Check terminal output for Python errors

For competition-specific questions, refer to the Kaggle competition page.

