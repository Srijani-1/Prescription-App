from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    prescriptions = relationship("Prescription", back_populates="owner", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="owner", cascade="all, delete-orphan")

class PendingUser(Base):
    __tablename__ = "pending_users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String)
    email = Column(String, index=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String)
    otp_code = Column(String)
    otp_expires_at = Column(DateTime)

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    raw_text = Column(Text)
    avg_confidence = Column(Float)
    results_json = Column(Text) # JSON string
    country = Column(String)
    currency = Column(String)
    image_url = Column(String)

    owner = relationship("User", back_populates="prescriptions")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    dose = Column(String)
    color = Column(String)
    color_bg = Column(String)

    owner = relationship("User", back_populates="medications")
    times = relationship("MedicationTime", back_populates="medication", cascade="all, delete-orphan")

class MedicationTime(Base):
    __tablename__ = "medication_times"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    medication_id = Column(String, ForeignKey("medications.id"))
    label = Column(String)
    time = Column(String)
    taken = Column(Boolean, default=False)
    icon = Column(String)

    medication = relationship("Medication", back_populates="times")
