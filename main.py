import joblib
import pandas as pd
import os
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Mental_Health_Model.pkl")
model = joblib.load(MODEL_PATH)

top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI()

class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100)
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    
    # Updated limits to match frontend
    avg_daily_usage_hours   : float = Field(..., ge=0, le=18)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=16)
    physical_activity_hours : float = Field(..., ge=0, le=8)
    sleep_hours_per_night   : float = Field(..., ge=3, le=14)
    stress_level            : Literal['Medium', 'Low', 'Very High', 'High']

class PredictionResponse(BaseModel):
    predicted_mental_health_score: float

@app.get("/health")
def health_check():
    return {"status": "awake"}

@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):
   country_group = data.country if data.country in top_countries else "Other"

   input_row = pd.DataFrame([{
        'Age'                       :data.age,
        'Gender'                    :data.gender,
        'Country'                   :data.country,
        'Academic_Level'            :data.academic_level,
        'Most_Used_Platform'        :data.most_used_platform,
        'Purpose_Of_Use'            :data.purpose_of_use,
        'Avg_Daily_Usage_Hours'     :data.avg_daily_usage_hours,
        'Daily_Unlocks'             :data.daily_unlocks,
        'Study_Hours'               :data.study_hours,
        'Physical_Activity_Hours'   :data.physical_activity_hours,
        'Sleep_Hours_Per_Night'     :data.sleep_hours_per_night,
        'Stress_Level'              :data.stress_level,
        'Grouped_country'           :country_group
   }])

   prediction = model.predict(input_row)[0]
   return PredictionResponse(predicted_mental_health_score=round(float(prediction),2))

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

@app.get("/style.css")
def serve_stylesheet():
    return FileResponse(os.path.join(BASE_DIR, "static", "style.css"))

@app.get("/script.js")
def serve_script():
    return FileResponse(os.path.join(BASE_DIR, "static", "script.js"))

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(BASE_DIR, "static", "index.html"))