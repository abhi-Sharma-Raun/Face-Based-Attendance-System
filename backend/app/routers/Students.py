from fastapi import UploadFile, File, APIRouter, Form, Depends, status, HTTPException
import numpy as np
import cv2
from insightface.app import FaceAnalysis
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, oauth2
from ..config import settings

router=APIRouter(
    tags=["Manage Students"]
)
 
registered_users = []

model_embedding = FaceAnalysis('buffalo_l', providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'], root = 'models')
model_embedding.prepare(ctx_id=-1, det_size=(320,256), det_thresh=0.5)


eye_angle_threshold = settings.eye_angle_thresh
eye_mouth_threshold = settings.eye_mouth_thresh
jawline_symmetry_threshold = settings.jawline_symmetry_thresh
nose_mouth_ratio_lower = settings.nose_mouth_ratio_lower
nose_mouth_ratio_upper = settings.nose_mouth_ratio_upper


def process_image(img):
#    display_frame = img.copy()
    faces = model_embedding.get(img)
    is_aligned_face = False
    return_result = {"faces": None, "isFaceAligned": None, "detail": None}
     
    if len(faces) == 1:
        face = faces[0]
        landmarks = face.landmark_2d_106
        # landmark parameters
        LEFT_EYE = 92
        RIGHT_EYE = 34
        MOUTH = 62 
        
        left_eye = landmarks[LEFT_EYE]
        right_eye = landmarks[RIGHT_EYE]
        mouth_center = landmarks[MOUTH]
        nose_tip = landmarks[86]
        right_jaw = landmarks[[8,7,6,5,4,3,2,12,13,14,15,16]]   # right jawline 
        left_jaw = landmarks[[24,23,22,21,20,19,18,28,29,30,31,32]]  # left jawline 
        
        # Eye line angle 
        dy = left_eye[1] - right_eye[1]
        dx = left_eye[0] - right_eye[0]
        eye_angle = abs(np.degrees(np.arctan2(dy, dx)))
        # check vertical alignment (eye-nose-mouth symmetry)
        eye_midpoint_ordinate = (left_eye[1] + right_eye[1]) / 2
        mouth_eye_delta_ordinate = abs(mouth_center[1] - eye_midpoint_ordinate)
        nose_eye_delta_ordinate = abs(nose_tip[1] - eye_midpoint_ordinate)
        nose_mouth_ratio = mouth_eye_delta_ordinate / nose_eye_delta_ordinate if nose_eye_delta_ordinate != 0 else 0
        # mouth-eye horizontal symmetry
        eyeCenterX = (left_eye[0] + right_eye[0]) / 2
        mouth_eye_delta_X = abs(mouth_center[0] - eyeCenterX)
        eye_distance = np.linalg.norm(np.array(left_eye) - np.array(right_eye))
        mouth_eye_normalized_ratio = mouth_eye_delta_X / eye_distance if eye_distance !=0 else 0
        #check head alignment using jawline
        head_symmetry_error = np.mean(np.abs(left_jaw[:,1] - right_jaw[:,1]))
        
        
        if(eye_angle > eye_angle_threshold ):
            print(f"eye angle not aligned: {eye_angle}")
        else:
            print(f"eye angle aligned: {eye_angle}")
            
        if(nose_mouth_ratio < nose_mouth_ratio_lower or nose_mouth_ratio > nose_mouth_ratio_upper):
            print(f"nose-mouth not aligned: {nose_mouth_ratio}")
        else:
            print(f"nose-mouth aligned: {nose_mouth_ratio}")    
            
        if(mouth_eye_normalized_ratio > eye_mouth_threshold):
            print(f"mouth-eye horizontal not aligned: {mouth_eye_normalized_ratio}")
        else:
            print(f"mouth-eye horizontal aligned: {mouth_eye_normalized_ratio}")    
            
        if(head_symmetry_error > jawline_symmetry_threshold):
            print(f"head not aligned: {head_symmetry_error}")
        else:
            print(f"head aligned: {head_symmetry_error}")
        
        
        
        
        if((eye_angle < eye_angle_threshold) and (nose_mouth_ratio > nose_mouth_ratio_lower and nose_mouth_ratio < nose_mouth_ratio_upper) 
           and (mouth_eye_normalized_ratio < eye_mouth_threshold) and (head_symmetry_error < jawline_symmetry_threshold)):
            is_aligned_face = True
            print("Face is aligned")
        else:
            is_aligned_face = False
            print("Face is not aligned")
        detail = "1 face detcted and it is aligned well" if is_aligned_face else "1 face detcted but it is not aligned"
        
        return_result = {"faces": faces, "isFaceAligned": is_aligned_face, "detail": detail}

    elif len(faces) > 1:
        print("Multiple faces detected")
        return_result = {"faces": faces, "isFaceAligned": None, "detail": "More than 1 faces detcted"}
        
    else:
        print("No faces detected")
        return_result["detail"]="No faces detcted"
        
    return return_result    
    
        
        

@router.post("/addStudent")
async def add_student(
    data:str = Form(...),
    image: UploadFile = File(...), db: Session = Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)
    ):
    
    try:
        student_details = schemas.AddStudentSchema.model_validate_json(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {e}")

    
#    Keep a check to ensure that no 2 students have similar/same face 
    name = student_details.name
    roll_no = student_details.roll_no
    
    current_user_id = current_user.id
    duplicate_student_check = db.query(models.Students).filter((models.Students.teacher_id==current_user_id) & (models.Students.roll_no==roll_no)).first()
    if duplicate_student_check is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="There is already a student with the same roll No.")
    
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    result = process_image(img)
    if (result['isFaceAligned'] == None):
        print("there is more than 1 or no faces in the frame")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Face processing error: {result['detail']}")      
    elif (result["isFaceAligned"] == False):
        print("The face is not aligned")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Face processing error: {result['detail']}")  
    elif (result["isFaceAligned"] == True):        
        #check to ensure that no 2 students of the same class have same photo
        try:
            face=result["faces"][0]
            face_embeddings = face.embedding
            binary_embeddings = face_embeddings.tobytes()
            new_student = models.Students(roll_no=roll_no, name=name, face_encoding=binary_embeddings, teacher_id=current_user_id)
            db.add(new_student)
            db.commit()
        except Exception as e:
            print(f"DB commit failed: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB error: {e}")
        print("The image is registered succesfully")
        return {"msg": "The face is registered successfully"}
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error during face processing")
     

@router.get("/get_all_students")
def get_students(current_user: schemas.verifiedToken = Depends(oauth2.get_current_user) ,db: Session=Depends(get_db)):
    
    current_user_id = current_user.id
    
    all_students = db.query(models.Students).filter(models.Students.teacher_id == current_user_id).all()

    final_students = [
        schemas.students_out(name=student.name, roll_no=student.roll_no)
        for student in all_students
    ]   
    
    return {"msg": final_students}


@router.delete("/delete_student/{roll_no}")
def delete_students(roll_no: str, db: Session = Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)):
    
    current_user_id = current_user.id
    
    try:
        student_query = db.query(models.Students).filter((models.Students.teacher_id == current_user_id) & (models.Students.roll_no == roll_no))    
        if not student_query.first():
            raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail="Student not found")
    
        student_query.delete(synchronize_session = False)
    except Exception as e:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = f"Error deleting student: {str(e)}")
    
    return {"msg": "Student deleted successfully"}