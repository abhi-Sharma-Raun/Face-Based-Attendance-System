from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, status
import numpy as np
import cv2
from insightface.app import FaceAnalysis
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models, oauth2, schemas
from ..database import get_db
from datetime import date
from ..config import settings

router = APIRouter(
    tags = ['Mark Attendance']
)
    

face_app = FaceAnalysis(name="buffalo_l", providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'], root = 'models')
face_app.prepare(ctx_id=-1, det_size=(320,256), det_thresh = 0.5)

face_attendance_threshold = settings.face_attendance_similarity_threshold

@router.post("/mark_attendance")
async def mark_attendance(file: UploadFile = File(...), db: Session=Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)):
    
    current_user_id = current_user.id
    
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Error reading image: {str(e)}")
        raise HTTPException(status_code = status.HTTP_503_SERVICE_UNAVAILABLE, detail = f"Error reading image: {str(e)}")
    
    all_students=db.query(models.Students).filter(models.Students.teacher_id==current_user_id).all()
    if(len(all_students)==0):
        print("The teacher has no students")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The teacher has no students")    
    
    attendance_marked_student_list = db.query(models.Attendance.student_id).join(models.Students).filter(
        models.Students.teacher_id == current_user_id,
        func.date(models.Attendance.attendance_date) == date.today()
        ).all()
    attendance_marked_student_list = [student_id for (student_id,) in attendance_marked_student_list]
    
    all_students = [
            student for student in all_students
            if student.student_id not in attendance_marked_student_list
            ]
    
    student_embeddings=[]
    student_objects=[]
    
    if len(all_students) == 0:
        print("Attendance already marked for all students today")
        return {"msg":"Attendance already marked for all students today"}
    
    faces = face_app.get(img)
    num_faces_detected = len(faces)
    if num_faces_detected == 0:
        print("no faces detected")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="There are no faces in the frame")
    
    for student in all_students:
        embedding = np.frombuffer(student.face_encoding, np.float32)
        student_embeddings.append(embedding)
        student_objects.append(student)
    
    student_embeddings = np.vstack(student_embeddings)
    
    face_embeddings = [face.embedding for face in faces]
    face_embeddings = np.column_stack(face_embeddings)
 
    face_norms = np.linalg.norm(face_embeddings, axis=0, keepdims=True) + 1e-10
    student_norms = np.linalg.norm(student_embeddings, axis=1, keepdims=True) + 1e-10
    similarity_norms = np.dot(student_norms, face_norms)
        
    similarities = np.dot(student_embeddings, face_embeddings)      
    cosine_similarities = similarities / similarity_norms
    
    max_similarities = list(np.argmax(cosine_similarities, axis=0))
    
    marked_ids = set()
    attendance_records = []
    for index, row_num in enumerate(max_similarities):
        if cosine_similarities[row_num, index] > face_attendance_threshold:
            student_id_attendance = student_objects[row_num].student_id
            if student_id_attendance in marked_ids:
                continue
            mark_attendance = models.Attendance(student_id = student_id_attendance)
            attendance_records.append(mark_attendance)
            marked_ids.add(student_id_attendance)
       
    if len(attendance_records) != 0:
        try:
            for rec in attendance_records:
                db.add(rec)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"DB commit failed: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB error: {e}")    
        
    
    print(f"Attendance marked succesfully for {len(marked_ids)} faces")
    return {"msg":f"attendance marked succesfully for {len(marked_ids)} faces out of total {num_faces_detected} detected faces"}
    
        
    