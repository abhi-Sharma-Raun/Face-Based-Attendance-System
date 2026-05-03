from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, utils
from ..database import get_db
import smtplib
from sendgrid.helpers.mail import Mail
from ..config import settings
from .. import utils

router = APIRouter(
    tags = ["Create Account"]
)

def account_confirmation(email_id:str, user_id:str, password:str):
    
    msg_content=f"""Your account is created successfully.
    User Id:  {user_id}.
    Password:  {password}.
    """    
    message = Mail(
        from_email=settings.from_email_Id,
        to_emails=email_id,
        subject="Account Confirmation",
        html_content=f'<body>{msg_content}</body>'
    )
    try:
        response = utils.sg.send(message)
        print(response.status_code)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"some error occurred: {str(e)}")

    
    
@router.post("/verify-email-confirm-otp")
def verify_otp(otp_credentials: schemas.otpSchema, db: Session = Depends(get_db)):
    
    email = otp_credentials.email
    otp = otp_credentials.otp
    try:
        stored_otp = utils.get_stored_otp(email)
    except:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = "Redis error while fetching the otp")
    
    if not stored_otp:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "otp expired or not found")
    
    if stored_otp != str(otp):
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Invalid otp")
    
    try:
        utils.delete_otp(email)
    except:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = "error while deleting the otp")    
      
    try:    
        verified_emails = db.query(models.VerifiedEmails).filter(models.VerifiedEmails.email_id == email).first()
        if verified_emails:
            raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail="The email id is already registered")
    
        new_email = models.VerifiedEmails(email_id=email)
        db.add(new_email)
        db.commit()
    except Exception as e:
        print(str)
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected database Error: {str(e)}")
    
    return {"msg":"Email is valid and confirmed successfully"}
    
    
@router.post("/send-email-verification-otp")
def send_otp(email_input : schemas.EmailSchema, db: Session = Depends(get_db)):
    email = email_input.email
    
    try:
        verified_emails = db.query(models.VerifiedEmails).filter(models.VerifiedEmails.email_id == email).first()
    except Exception as e:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected database Error: {str(e)}")
    
    if verified_emails:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail="The email id is already registered")
    
    try:
        utils.send_otp(email)
    except Exception as e :
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected Error: {str(e)}")
        
    return {"msg": "otp sent successfully to your email"}

    
@router.post("/create_user", status_code = status.HTTP_201_CREATED)
def create_user(user: schemas.userCreate, db: Session = Depends(get_db)):
    try:
        hashed_password = utils.hash(user.password)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"The input cannot be processed: {str(e)}")
    
    verified_emails = db.query(models.VerifiedEmails).filter(models.VerifiedEmails.email_id == user.email).first()
    if not verified_emails:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="First verify your mail id")
      
    try:       
        new_user = models.Users(user_id=user.user_id, email=user.email, password_hash=hashed_password)
        print("going good")
        db.add(new_user)
        db.commit()
        
        account_confirmation(email_id=user.email, user_id=user.user_id, password=user.password)
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected database Error: {str(e)}")
    
    return {"msg": f"The new user is created successfully"}


# To verify email use routes in Create Account(create_user) first use send-otp route then use route verify-email-confirm-otp to verify the otp if the otp is correct
#  then your email will be registered successfully 

    