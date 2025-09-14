from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime

class userCreate(BaseModel):
    user_id: str
    email: EmailStr
    password: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str    
    
class verifiedToken(BaseModel):
    id: str
    token_id: str
    expiration_time: datetime
    class Config:
        from_attributes=True
       
class students_Attendance_out(BaseModel):
    name: str
    roll_no: str
    all_presentDates: List
    class Config:
        from_attributes=True
        
class students_out(BaseModel):
    name: str
    roll_no: str   
    class config:
        from_attributes=True
    
class EmailSchema(BaseModel):
    email: EmailStr
    
class otpSchema(EmailSchema):
    otp:str

class passwordChangeSchema(otpSchema):
    new_password: str

class baseStudentSchema(BaseModel):
    roll_no: str

class AddStudentSchema(baseStudentSchema):
    name: str
    class config:
        from_attributes=True
    