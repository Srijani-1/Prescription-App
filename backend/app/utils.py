from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from . import models
from typing import List

def check_and_reset_daily(user_id: str, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    now = datetime.now()
    today = now.date()
    
    # Initialize last_activity_date if None
    if user.last_activity_date is None:
        user.last_activity_date = now
        db.commit()
        return user

    last_active = user.last_activity_date.date()
    
    if last_active < today:
        # It's a new day!
        
        # 1. Update Streak
        # Check DoseLog for the last active date (yesterday or whenever they were last on)
        any_taken_last_active = db.query(models.DoseLog).filter(
            models.DoseLog.user_id == user_id,
            models.DoseLog.date == last_active.isoformat(),
            models.DoseLog.taken == True
        ).first() is not None
        
        # Streak logic:
        # If last_active was exactly yesterday and they took something: keep streak
        # If they skipped a day or didn't take anything: reset streak
        if (today - last_active).days == 1:
            if not any_taken_last_active:
                user.streak = 0
        else:
            # They skipped one or more days entirely
            user.streak = 0
            
        # 2. Reset Doses (Legacy field support - though we use DoseLog now)
        meds = db.query(models.Medication).filter(models.Medication.user_id == user.id).all()
        for med in meds:
            for t in med.times:
                t.taken = False
        
        # 3. Update last_activity_date to today
        user.last_activity_date = now
        db.commit()
        
    return user

def update_streak_on_dose(user_id: str, db: Session):
    """Call this when a dose is marked as taken."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return
    
    now = datetime.now()
    today = now.date()
    
    # If they haven't incremented streak today, do it now
    if user.last_streak_date is None or user.last_streak_date.date() < today:
        user.streak += 1
        user.last_streak_date = now
        db.commit()

def compute_comprehensive_score(medications: List[models.Medication], target_date: str, db: Session) -> int:
    """
    Calculates a health score (0-100) based on:
    - 70% Adherence: Doses taken on the target_date
    - 30% Supply: Stock levels (remaining vs total)
    """
    if not medications:
        return 0
    
    total_doses = 0
    taken_doses = 0
    total_stock_pct = 0.0
    
    for med in medications:
        # ── Adherence (70% weight) ──
        times = med.times
        total_doses += len(times)
        for t in times:
            log = db.query(models.DoseLog).filter(
                models.DoseLog.medication_time_id == t.id,
                models.DoseLog.date == target_date,
                models.DoseLog.taken == True
            ).first()
            if log:
                taken_doses += 1
        
        # ── Supply (30% weight) ──
        rem = med.remaining_quantity if med.remaining_quantity is not None else 0
        tot = med.total_quantity if med.total_quantity and med.total_quantity > 0 else 30.0
        total_stock_pct += min(1.0, rem / tot)
        
    # Adherence component
    adherence_pct = (taken_doses / total_doses) if total_doses > 0 else 1.0
    
    # Stock component
    avg_stock_pct = (total_stock_pct / len(medications))
    
    # Weighted average
    # If no doses are scheduled today, the score is mostly stock-based
    if total_doses == 0:
        score = int(avg_stock_pct * 100)
    else:
        score = int((adherence_pct * 0.7 + avg_stock_pct * 0.3) * 100)
        
    return max(0, min(100, score))
