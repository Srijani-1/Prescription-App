from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from typing import List

router = APIRouter(prefix="/api/medications", tags=["Medications"])

@router.get("", response_model=List[schemas.MedicationResponse])
async def get_medications(user_id: str, db: Session = Depends(get_db)):
    meds = db.query(models.Medication).filter(models.Medication.user_id == user_id).all()
    return meds

@router.put("/{medication_id}/times/{time_id}/toggle", response_model=schemas.MedicationTimeResponse)
async def toggle_time(medication_id: str, time_id: str, db: Session = Depends(get_db)):
    db_time = db.query(models.MedicationTime).filter(models.MedicationTime.id == time_id, models.MedicationTime.medication_id == medication_id).first()
    if not db_time:
        raise HTTPException(status_code=404, detail="Medication time not found")
    
    db_time.taken = not db_time.taken
    db.commit()
    db.refresh(db_time)
    return db_time
