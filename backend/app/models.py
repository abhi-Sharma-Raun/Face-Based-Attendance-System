from .database import Base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column,String, ForeignKey, LargeBinary, UniqueConstraint
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text

class Users(Base):
    __tablename__="users_Teachers"
    user_id=Column(String(20), primary_key=True)
    email=Column(String, unique=True, nullable=False)
    password_hash=Column(String,nullable=False)  #do authentication logic after setting up registration pipeline      
    created_at=Column(TIMESTAMP(timezone=True), server_default=text('now()'), nullable=False)

class Students(Base):
    __tablename__="students"
    student_id=Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    roll_no=Column(String, nullable=False) 
    name=Column(String, nullable=False)
    email=Column(String, nullable=True)  #keep it optional for now make it unique and compulsory later make the teacher_id+email unique
    mime_type=Column(String(50), nullable=True)
    face_encoding=Column(LargeBinary, nullable=False)
    teacher_id=Column(String(20), ForeignKey("users_Teachers.user_id", ondelete="CASCADE"), nullable=False)
    created_at=Column(TIMESTAMP(timezone=True), server_default=text("now()"), nullable=False)
    __table_args__=(
        UniqueConstraint("teacher_id", "roll_no", name="teacherId_rollNo"),
    )
    
class Attendance(Base):
    __tablename__="Attendance_Record"    
    attendance_id=Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    student_id=Column(UUID(as_uuid=True), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    attendance_date=Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_DATE"), nullable=False)
    __table_args__=(
        UniqueConstraint("student_id", "attendance_date", name="studentId_attendanceDate"),
    )
    
class VerifiedEmails(Base):
    __tablename__="verified_emails"
    email_id=Column(String, primary_key=True)
    