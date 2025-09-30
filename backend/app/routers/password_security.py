from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from .. import models, utils, schemas
from ..database import get_db

router = APIRouter(
    tags = ["Passwords Security Routes"]
)

@router.post("/forgot-password-send-otp")
def forgot_password(email_input: schemas.EmailSchema, db: Session = Depends(get_db)):
    
    email = email_input.email
    user = db.query(models.Users).filter(models.Users.email == email).first()
    
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, details = "There is no account with that email")
    
    try:
        subject = "Your OTP for Password Reset"
        utils.send_otp(email, subject)
    except:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, details=f"Unexpected Error")
    
    return {"msg": "Otp sent successfully to your email"}
    
@router.put("/forgot-password-verify-otp")      
def change_password(change_password_credentials: schemas.passwordChangeSchema, db: Session = Depends(get_db)):
    
    email = change_password_credentials.email
    otp = change_password_credentials.otp
    password = change_password_credentials.new_password
    
    stored_otp = utils.get_stored_otp(email)
    
    if not stored_otp:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "The otp is invalid")
    
    if stored_otp.decode() != otp:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Invalid otp")
    
    utils.delete_otp(email)
    
    user_query = db.query(models.Users).filter(models.Users.email == email)
    
    if not user_query.first():
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "There is no such user")
    
    password_hash = utils.hash(password)
    
    user_query.update({"password_hash":password_hash}, synchronize_session = False)
    db.commit()
    
    return {"msg": "Password changed successfully"}
    
# If someone forget password use email otp which will be sent to you to change the password and then you enter otp and new password in the verify-otp-change-password
# route then otp will be verified and password will be changed

# if one wants to change the password he may use the same procedure as forgot password

# add another thing that is press a limit that after requesting a otp one can't request otp from same email for next 2 minutes