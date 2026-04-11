from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json
from ..database import get_db
from .. import models, schemas
from pydantic import BaseModel
from typing import List, Optional
from fastapi import HTTPException

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])

@router.get("/history", response_model=schemas.HistoryResponse)
async def get_history(user_id: str, db: Session = Depends(get_db)):
    rows = db.query(models.Prescription).filter(models.Prescription.user_id == user_id).order_by(models.Prescription.date.desc()).all()
    
    history = []
    for row in rows:
        history.append({
            "id": row.id,
            "date": row.date,
            "raw_text": row.raw_text,
            "avg_confidence": row.avg_confidence,
            "results": json.loads(row.results_json),
            "country": row.country,
            "currency": row.currency
        })
    return {"status": "success", "history": history}


class EditPrescriptionRequest(BaseModel):
    results: List[dict]

@router.put("/{prescription_id}")
async def update_prescription(prescription_id: str, req: EditPrescriptionRequest, db: Session = Depends(get_db)):
    record = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    
    old_results = json.loads(record.results_json) if record.results_json else []
    
    # 1. Update Prescription history
    record.results_json = json.dumps(req.results)
    
    # 2. Sync Medications (dose tracker)
    # Delete old medications tied to this scan
    for old_med in old_results:
        med_name = old_med.get("medicine") or old_med.get("name", "Unknown")
        db_med = db.query(models.Medication).filter(
            models.Medication.user_id == record.user_id,
            models.Medication.name == med_name
        ).first()
        if db_med:
            db.delete(db_med)
            
    # Add newly edited medications
    colors = [
        {"color": "#3B82F6", "bg": "#DBEAFE"},
        {"color": "#D97706", "bg": "#FEF3C7"},
        {"color": "#8B5CF6", "bg": "#EDE9FE"},
        {"color": "#10B981", "bg": "#D1FAE5"}
    ]
    for idx, new_med in enumerate(req.results):
        med_name = new_med.get("medicine") or new_med.get("name", "Unknown")
        med_dose = new_med.get("dosage") or new_med.get("dose", "Standard dose")
        c = colors[idx % len(colors)]
        
        nm = models.Medication(
            user_id=record.user_id,
            name=med_name,
            dose=med_dose,
            color=c["color"],
            color_bg=c["bg"]
        )
        db.add(nm)
        db.commit()
        db.refresh(nm)
        
        t1 = models.MedicationTime(medication_id=nm.id, label="Morning", time="8:00 AM", taken=False, icon="weather-sunny")
        t2 = models.MedicationTime(medication_id=nm.id, label="Evening", time="8:00 PM", taken=False, icon="weather-sunset")
        db.add_all([t1, t2])

    db.commit()
    return {"status": "success"}

@router.delete("/{prescription_id}")
async def delete_prescription(prescription_id: str, db: Session = Depends(get_db)):
    record = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Also delete associated tracked meds
    old_results = json.loads(record.results_json) if record.results_json else []
    for old_med in old_results:
        med_name = old_med.get("medicine") or old_med.get("name", "Unknown")
        db_med = db.query(models.Medication).filter(
            models.Medication.user_id == record.user_id,
            models.Medication.name == med_name
        ).first()
        if db_med:
            db.delete(db_med)

    db.delete(record)
    db.commit()
    return {"status": "success"}
