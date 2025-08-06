from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import io
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
import json
import sqlite3
from datetime import datetime, date
import tempfile
import random

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Initialize database
def init_db():
    conn = sqlite3.connect('medical_records.db')
    cursor = conn.cursor()
    
    # Create medical records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_text TEXT,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create prescriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            medicines TEXT,
            analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create macro entries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS macro_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_input TEXT NOT NULL,
            transcribed_text TEXT,
            parsed_foods TEXT,
            total_calories REAL DEFAULT 0,
            total_protein REAL DEFAULT 0,
            total_carbs REAL DEFAULT 0,
            total_fat REAL DEFAULT 0,
            entry_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create daily macro stats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_macro_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_date DATE UNIQUE NOT NULL,
            total_calories REAL DEFAULT 0,
            total_protein REAL DEFAULT 0,
            total_carbs REAL DEFAULT 0,
            total_fat REAL DEFAULT 0,
            meal_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def process_image_with_gemini(image_data, prompt):
    """Process image using Gemini model"""
    try:
        # Convert base64 to PIL Image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate response
        response = model.generate_content([prompt, image])
        return response.text
    except Exception as e:
        return f"Error processing image: {str(e)}"

def generate_summary(text):
    """Generate summary using Gemini model"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Please provide a concise medical summary of the following medical record text. Focus on key diagnoses, treatments, medications, and important medical information:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def process_audio_with_gemini(audio_data):
    """Process audio using Gemini model for speech-to-text"""
    try:
        # Save audio data to temporary file
        audio_bytes = base64.b64decode(audio_data.split(',')[1])
        
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Use Gemini for speech-to-text
            audio_file = genai.upload_file(temp_file_path)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = """
            Please transcribe this audio recording accurately. The person is describing what they ate during the day.
            Only return the transcribed text, nothing else.
            """
            
            response = model.generate_content([prompt, audio_file])
            return response.text
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        return f"Error processing audio: {str(e)}"

def parse_food_and_calculate_macros(transcribed_text):
    """Parse food items from text and calculate macros using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Analyze the following food diary entry and extract detailed nutritional information:

        "{transcribed_text}"

        Please provide a JSON response with the following structure:
        {{
            "foods": [
                {{
                    "name": "food name",
                    "quantity": "estimated quantity/serving size",
                    "calories": estimated_calories_per_serving,
                    "protein": estimated_protein_grams,
                    "carbs": estimated_carbs_grams,
                    "fat": estimated_fat_grams
                }}
            ],
            "total_calories": sum_of_all_calories,
            "total_protein": sum_of_all_protein,
            "total_carbs": sum_of_all_carbs,
            "total_fat": sum_of_all_fat,
            "analysis": "brief explanation of the nutritional breakdown"
        }}

        Important notes:
        - Make reasonable estimates for quantities if not specified
        - Use standard serving sizes and nutritional databases
        - Be as accurate as possible with macro calculations
        - If unsure about a food item, make a reasonable estimate
        - Return only valid JSON, no additional text
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # If JSON parsing fails, extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not extract valid JSON from response")
                
    except Exception as e:
        return {
            "error": f"Error parsing food data: {str(e)}",
            "foods": [],
            "total_calories": 0,
            "total_protein": 0,
            "total_carbs": 0,
            "total_fat": 0,
            "analysis": "Failed to analyze food data"
        }

def update_daily_macro_stats(entry_date, calories, protein, carbs, fat):
    """Update or insert daily macro statistics"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        
        # Check if entry exists for today
        cursor.execute('''
            SELECT id, total_calories, total_protein, total_carbs, total_fat, meal_count
            FROM daily_macro_stats 
            WHERE entry_date = ?
        ''', (entry_date,))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update existing entry
            new_calories = existing[1] + calories
            new_protein = existing[2] + protein
            new_carbs = existing[3] + carbs
            new_fat = existing[4] + fat
            new_meal_count = existing[5] + 1
            
            cursor.execute('''
                UPDATE daily_macro_stats 
                SET total_calories = ?, total_protein = ?, total_carbs = ?, 
                    total_fat = ?, meal_count = ?, updated_at = CURRENT_TIMESTAMP
                WHERE entry_date = ?
            ''', (new_calories, new_protein, new_carbs, new_fat, new_meal_count, entry_date))
        else:
            # Insert new entry
            cursor.execute('''
                INSERT INTO daily_macro_stats 
                (entry_date, total_calories, total_protein, total_carbs, total_fat, meal_count)
                VALUES (?, ?, ?, ?, ?, 1)
            ''', (entry_date, calories, protein, carbs, fat))
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        print(f"Error updating daily stats: {str(e)}")

@app.route('/api/upload-medical-record', methods=['POST'])
def upload_medical_record():
    """Upload and process medical record image"""
    try:
        data = request.json
        image_data = data.get('image')
        filename = data.get('filename', 'medical_record.jpg')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Process image with Gemini
        ocr_prompt = """
        Please extract all text from this medical record image. 
        Organize the information clearly and maintain the structure of the document.
        Include all patient information, diagnoses, treatments, medications, dates, and any other relevant medical information.
        """
        
        extracted_text = process_image_with_gemini(image_data, ocr_prompt)
        
        # Generate summary
        summary = generate_summary(extracted_text)
        
        # Save to database
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO medical_records (filename, original_text, summary)
            VALUES (?, ?, ?)
        ''', (filename, extracted_text, summary))
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': record_id,
            'filename': filename,
            'extracted_text': extracted_text,
            'summary': summary,
            'message': 'Medical record processed successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medical-records', methods=['GET'])
def get_medical_records():
    """Get all medical records"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, summary, created_at
            FROM medical_records
            ORDER BY created_at DESC
        ''')
        records = cursor.fetchall()
        conn.close()
        
        return jsonify([{
            'id': record[0],
            'filename': record[1],
            'summary': record[2],
            'created_at': record[3]
        } for record in records])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medical-record/<int:record_id>', methods=['GET'])
def get_medical_record(record_id):
    """Get specific medical record"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, original_text, summary, created_at
            FROM medical_records
            WHERE id = ?
        ''', (record_id,))
        record = cursor.fetchone()
        conn.close()
        
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        return jsonify({
            'id': record[0],
            'filename': record[1],
            'original_text': record[2],
            'summary': record[3],
            'created_at': record[4]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-prescription', methods=['POST'])
def analyze_prescription():
    """Analyze prescription image"""
    try:
        data = request.json
        image_data = data.get('image')
        filename = data.get('filename', 'prescription.jpg')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Extract prescription information
        extraction_prompt = """
        Please analyze this prescription image and extract the following information:
        1. Patient name (if visible)
        2. Doctor name and clinic/hospital
        3. Date of prescription
        4. List of all prescribed medicines with their:
           - Generic name and brand name (if available)
           - Dosage (strength)
           - Frequency (how often to take)
           - Duration (how long to take)
           - Special instructions
        
        Format the response as a structured JSON with the following format:
        {
            "patient_name": "...",
            "doctor_name": "...",
            "clinic": "...",
            "date": "...",
            "medicines": [
                {
                    "name": "...",
                    "generic_name": "...",
                    "dosage": "...",
                    "frequency": "...",
                    "duration": "...",
                    "instructions": "..."
                }
            ]
        }
        """
        
        extracted_info = process_image_with_gemini(image_data, extraction_prompt)
        
        # Analyze medicine purposes
        analysis_prompt = f"""
        Based on the following prescription information, please provide a detailed explanation for each medicine:
        
        {extracted_info}
        
        For each medicine, explain:
        1. What condition or symptom it treats
        2. How it works in the body
        3. Why the doctor might have prescribed it
        4. Important things the patient should know
        
        Provide the response in a clear, patient-friendly format that helps them understand their treatment.
        """
        
        medicine_analysis = process_image_with_gemini(image_data, analysis_prompt)
        
        # Save to database
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO prescriptions (filename, medicines, analysis)
            VALUES (?, ?, ?)
        ''', (filename, extracted_info, medicine_analysis))
        prescription_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': prescription_id,
            'filename': filename,
            'extracted_info': extracted_info,
            'analysis': medicine_analysis,
            'message': 'Prescription analyzed successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions', methods=['GET'])
def get_prescriptions():
    """Get all prescriptions"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, medicines, created_at
            FROM prescriptions
            ORDER BY created_at DESC
        ''')
        prescriptions = cursor.fetchall()
        conn.close()
        
        return jsonify([{
            'id': prescription[0],
            'filename': prescription[1],
            'medicines': prescription[2],
            'created_at': prescription[3]
        } for prescription in prescriptions])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescription/<int:prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    """Get specific prescription"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, medicines, analysis, created_at
            FROM prescriptions
            WHERE id = ?
        ''', (prescription_id,))
        prescription = cursor.fetchone()
        conn.close()
        
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        return jsonify({
            'id': prescription[0],
            'filename': prescription[1],
            'medicines': prescription[2],
            'analysis': prescription[3],
            'created_at': prescription[4]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-macro-speech', methods=['POST'])
def process_macro_speech():
    """Process audio for macro tracking"""
    try:
        data = request.json
        audio_data = data.get('audio')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Step 1: Convert speech to text using Gemini
        transcribed_text = process_audio_with_gemini(audio_data)
        
        if transcribed_text.startswith('Error'):
            return jsonify({'error': transcribed_text}), 500
        
        # Step 2: Parse food items and calculate macros
        macro_data = parse_food_and_calculate_macros(transcribed_text)
        
        if 'error' in macro_data:
            return jsonify({'error': macro_data['error']}), 500
        
        # Step 3: Save to database
        entry_date = date.today().isoformat()
        
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO macro_entries 
            (user_input, transcribed_text, parsed_foods, total_calories, 
             total_protein, total_carbs, total_fat, entry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('voice_input', transcribed_text, json.dumps(macro_data['foods']),
              macro_data['total_calories'], macro_data['total_protein'],
              macro_data['total_carbs'], macro_data['total_fat'], entry_date))
        
        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Step 4: Update daily statistics
        update_daily_macro_stats(
            entry_date,
            macro_data['total_calories'],
            macro_data['total_protein'],
            macro_data['total_carbs'],
            macro_data['total_fat']
        )
        
        return jsonify({
            'id': entry_id,
            'transcribed_text': transcribed_text,
            'macro_data': macro_data,
            'entry_date': entry_date,
            'message': 'Macro entry processed successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/macro-entries', methods=['GET'])
def get_macro_entries():
    """Get all macro entries"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, transcribed_text, total_calories, total_protein, 
                   total_carbs, total_fat, entry_date, created_at
            FROM macro_entries
            ORDER BY created_at DESC
        ''')
        entries = cursor.fetchall()
        conn.close()
        
        return jsonify([{
            'id': entry[0],
            'transcribed_text': entry[1],
            'total_calories': entry[2],
            'total_protein': entry[3],
            'total_carbs': entry[4],
            'total_fat': entry[5],
            'entry_date': entry[6],
            'created_at': entry[7]
        } for entry in entries])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/daily-macro-stats', methods=['GET'])
def get_daily_macro_stats():
    """Get daily macro statistics"""
    try:
        days = request.args.get('days', 7, type=int)  # Default last 7 days
        
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT entry_date, total_calories, total_protein, total_carbs, 
                   total_fat, meal_count, updated_at
            FROM daily_macro_stats
            ORDER BY entry_date DESC
            LIMIT ?
        ''', (days,))
        stats = cursor.fetchall()
        conn.close()
        
        return jsonify([{
            'entry_date': stat[0],
            'total_calories': stat[1],
            'total_protein': stat[2],
            'total_carbs': stat[3],
            'total_fat': stat[4],
            'meal_count': stat[5],
            'updated_at': stat[6]
        } for stat in stats])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/macro-entry/<int:entry_id>', methods=['GET'])
def get_macro_entry(entry_id):
    """Get specific macro entry with detailed food breakdown"""
    try:
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, user_input, transcribed_text, parsed_foods, 
                   total_calories, total_protein, total_carbs, total_fat,
                   entry_date, created_at
            FROM macro_entries
            WHERE id = ?
        ''', (entry_id,))
        entry = cursor.fetchone()
        conn.close()
        
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        # Parse the JSON foods data
        try:
            parsed_foods = json.loads(entry[3]) if entry[3] else []
        except json.JSONDecodeError:
            parsed_foods = []
        
        return jsonify({
            'id': entry[0],
            'user_input': entry[1],
            'transcribed_text': entry[2],
            'foods': parsed_foods,
            'total_calories': entry[4],
            'total_protein': entry[5],
            'total_carbs': entry[6],
            'total_fat': entry[7],
            'entry_date': entry[8],
            'created_at': entry[9]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-sample-medical-record', methods=['POST'])
def create_sample_medical_record():
    """Create sample medical record and populate other tabs with random data"""
    try:
        data = request.json
        filename = data.get('filename', 'sample_document.pdf')
        file_type = data.get('fileType', 'pdf')
        
        # Sample medical record data
        sample_medical_records = [
            {
                'original_text': """Patient: John Smith
Date of Visit: 2024-08-06
Chief Complaint: Annual physical examination and routine checkup
Vital Signs: BP 120/80, HR 72, Temp 98.6°F, Weight 175 lbs, Height 5'10"
Assessment: Patient is in good general health. All vital signs within normal limits.
Plan: Continue current medications, follow up in 6 months for routine checkup.
Medications: Lisinopril 10mg daily for hypertension management.""",
                'summary': 'Annual physical examination showing good general health with normal vital signs. Patient on Lisinopril for hypertension management.'
            },
            {
                'original_text': """Patient: Sarah Johnson
Date: 2024-08-05
Diagnosis: Type 2 Diabetes Mellitus, well controlled
HbA1c: 6.8% (target <7%)
Blood Glucose: Fasting 110 mg/dL
Current Medications: Metformin 500mg twice daily
Recommendations: Continue current regimen, dietary counseling, exercise program
Next appointment: 3 months""",
                'summary': 'Type 2 Diabetes follow-up visit. Well controlled with HbA1c 6.8%. Continuing Metformin therapy.'
            },
            {
                'original_text': """Emergency Department Visit
Patient: Michael Brown
Date: 2024-08-04
Chief Complaint: Chest pain and shortness of breath
ECG: Normal sinus rhythm, no acute changes
Chest X-ray: Clear lungs, normal cardiac silhouette
Diagnosis: Anxiety-related chest pain
Treatment: Lorazepam 1mg, patient education on anxiety management
Discharge: Stable condition, follow up with primary care in 1 week""",
                'summary': 'ED visit for chest pain. Workup negative for cardiac cause. Diagnosed with anxiety-related symptoms and discharged in stable condition.'
            }
        ]
        
        # Sample prescription data
        sample_prescriptions = [
            {
                'medicines': """Doctor: Dr. Emily Wilson, Internal Medicine Clinic
Patient: John Smith
Date: 2024-08-06

Medications Prescribed:
1. Lisinopril 10mg - Take once daily in the morning - 30 day supply
2. Atorvastatin 20mg - Take once daily at bedtime - 30 day supply
3. Aspirin 81mg - Take once daily with food - 30 day supply""",
                'analysis': """Medication Analysis:

1. Lisinopril (10mg): ACE inhibitor used for blood pressure management. Helps prevent heart disease and stroke. Take consistently at the same time each day.

2. Atorvastatin (20mg): Statin medication to lower cholesterol levels. Reduces risk of cardiovascular events. Best taken in the evening as cholesterol production peaks at night.

3. Aspirin (81mg): Low-dose aspirin for cardiovascular protection. Helps prevent blood clots. Take with food to reduce stomach irritation."""
            },
            {
                'medicines': """Doctor: Dr. Robert Chen, Endocrinology Associates  
Patient: Sarah Johnson
Date: 2024-08-05

Medications Prescribed:
1. Metformin ER 500mg - Take twice daily with meals - 90 day supply
2. Glipizide 5mg - Take once daily before breakfast - 90 day supply
3. Lantus Insulin 10 units - Inject once daily at bedtime - 30 day supply""",
                'analysis': """Diabetes Medication Analysis:

1. Metformin ER (500mg): First-line treatment for Type 2 diabetes. Reduces glucose production by the liver and improves insulin sensitivity. Extended-release formulation reduces GI side effects.

2. Glipizide (5mg): Sulfonylurea that stimulates insulin production. Helps lower blood sugar levels. Take before meals for optimal effectiveness.

3. Lantus Insulin (10 units): Long-acting basal insulin for glucose control. Provides steady insulin levels over 24 hours. Inject at the same time each evening."""
            }
        ]
        
        # Sample macro data
        sample_macro_entries = [
            {
                'transcribed_text': 'I had scrambled eggs with whole wheat toast and avocado for breakfast',
                'foods': [
                    {'name': 'Scrambled eggs', 'quantity': '2 large eggs', 'calories': 140, 'protein': 12, 'carbs': 1, 'fat': 10},
                    {'name': 'Whole wheat toast', 'quantity': '2 slices', 'calories': 160, 'protein': 6, 'carbs': 30, 'fat': 2},
                    {'name': 'Avocado', 'quantity': '1/2 medium', 'calories': 160, 'protein': 2, 'carbs': 9, 'fat': 15}
                ],
                'total_calories': 460, 'total_protein': 20, 'total_carbs': 40, 'total_fat': 27
            },
            {
                'transcribed_text': 'For lunch I ate a grilled chicken salad with mixed greens and olive oil dressing',
                'foods': [
                    {'name': 'Grilled chicken breast', 'quantity': '4 oz', 'calories': 185, 'protein': 35, 'carbs': 0, 'fat': 4},
                    {'name': 'Mixed green salad', 'quantity': '2 cups', 'calories': 20, 'protein': 2, 'carbs': 4, 'fat': 0},
                    {'name': 'Olive oil dressing', 'quantity': '2 tbsp', 'calories': 120, 'protein': 0, 'carbs': 0, 'fat': 14}
                ],
                'total_calories': 325, 'total_protein': 37, 'total_carbs': 4, 'total_fat': 18
            },
            {
                'transcribed_text': 'Dinner was salmon with quinoa and steamed broccoli',
                'foods': [
                    {'name': 'Baked salmon', 'quantity': '5 oz', 'calories': 280, 'protein': 40, 'carbs': 0, 'fat': 12},
                    {'name': 'Quinoa', 'quantity': '1 cup cooked', 'calories': 220, 'protein': 8, 'carbs': 39, 'fat': 4},
                    {'name': 'Steamed broccoli', 'quantity': '1 cup', 'calories': 25, 'protein': 3, 'carbs': 5, 'fat': 0}
                ],
                'total_calories': 525, 'total_protein': 51, 'total_carbs': 44, 'total_fat': 16
            }
        ]
        
        # Create random medical record
        record_data = random.choice(sample_medical_records)
        
        conn = sqlite3.connect('medical_records.db')
        cursor = conn.cursor()
        
        # Insert medical record
        cursor.execute('''
            INSERT INTO medical_records (filename, original_text, summary)
            VALUES (?, ?, ?)
        ''', (filename, record_data['original_text'], record_data['summary']))
        record_id = cursor.lastrowid
        
        # Insert random prescription
        prescription_data = random.choice(sample_prescriptions)
        cursor.execute('''
            INSERT INTO prescriptions (filename, medicines, analysis)
            VALUES (?, ?, ?)
        ''', (f"prescription_{filename}", prescription_data['medicines'], prescription_data['analysis']))
        prescription_id = cursor.lastrowid
        
        # Insert random macro entries
        entry_date = date.today().isoformat()
        total_daily_calories = 0
        total_daily_protein = 0
        total_daily_carbs = 0
        total_daily_fat = 0
        
        for macro_entry in sample_macro_entries:
            cursor.execute('''
                INSERT INTO macro_entries 
                (user_input, transcribed_text, parsed_foods, total_calories, 
                 total_protein, total_carbs, total_fat, entry_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', ('sample_data', macro_entry['transcribed_text'], json.dumps(macro_entry['foods']),
                  macro_entry['total_calories'], macro_entry['total_protein'],
                  macro_entry['total_carbs'], macro_entry['total_fat'], entry_date))
            
            total_daily_calories += macro_entry['total_calories']
            total_daily_protein += macro_entry['total_protein']
            total_daily_carbs += macro_entry['total_carbs']
            total_daily_fat += macro_entry['total_fat']
        
        # Update daily macro stats
        cursor.execute('''
            INSERT OR REPLACE INTO daily_macro_stats 
            (entry_date, total_calories, total_protein, total_carbs, total_fat, meal_count)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (entry_date, total_daily_calories, total_daily_protein, total_daily_carbs, total_daily_fat, 3))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'medical_record_id': record_id,
            'prescription_id': prescription_id,
            'macro_entries_created': len(sample_macro_entries),
            'message': 'Sample medical record and related data created successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

