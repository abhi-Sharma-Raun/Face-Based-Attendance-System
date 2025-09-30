from fastapi import APIRouter, status, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import models, schemas, oauth2
from ..database import get_db
from typing import Optional
from datetime import date
import csv
import io

router = APIRouter(
    tags=["Fetch Attendance"]
)

def out_datetime(sqlalchemy_attendance_object):
    date = str(sqlalchemy_attendance_object.attendance_date.date())
    return date

@router.get("/get-attendance/{roll_no}")
def fetch_attendance_rollno(roll_no:str, db: Session = Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)):
    
    current_user_id = current_user.id
    
    student = db.query(models.Students).filter((models.Students.teacher_id == current_user_id) & (models.Students.roll_no == roll_no)).first()
    
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="the teacher has no student with this roll number")
    
    try:
        attendance = db.query(models.Attendance).filter(models.Attendance.student_id == student.student_id).all()
        
        attendance_record_list = [record.attendance_date.date().isoformat() for record in attendance]    
        return {"data":attendance_record_list}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")
    
@router.get("/get-all-attendance")
def fetch_attendance(db: Session = Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user), 
                    start_date: Optional[date] = Query(None, description="Filter from this date (YYYY-MM-DD)"),
                    end_date: Optional[date] = Query(None, description="Filter from this date (YYYY-MM-DD)")):
    
    current_user_id = current_user.id
    students = db.query(models.Students).filter((models.Students.teacher_id == current_user_id)).all()
    
    if students is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"The teacher has no students")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Name", "Roll_no", "Present_dates"])
    
    try:
        for student in students:

            attendance_query = db.query(models.Attendance).filter(
                (models.Attendance.student_id == student.student_id))
            
            if start_date:
                attendance_query = attendance_query.filter(models.Attendance.attendance_date >= start_date)
            if end_date:
                attendance_query = attendance_query.filter(models.Attendance.attendance_date <= end_date)
                
            attendance_record = attendance_query.order_by(models.Attendance.attendance_date.asc()).all()
            
            present_dates = list(map(out_datetime, attendance_record))
                
            writer.writerow([student.name, student.roll_no, ", ".join(present_dates)])

        output.seek(0)
            
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"content-disposition": "attachement; filename=attendance.csv"}
        )
                
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexcepted error: {str(e)}")
    
    
# Try writing a route to not see but download the attendance in csv file make it as a see only for now after make it download only
# so that the attendance do not clutter on the webpage

        
        
