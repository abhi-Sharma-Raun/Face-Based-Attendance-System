import random
from passlib.context import CryptContext
import redis
import smtplib
from fastapi import HTTPException, status
from email.message import EmailMessage
from .config import settings

r = redis.Redis(host=f"{settings.redis_host}", port=settings.redis_port, db=0)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash(password: str):
    return pwd_context.hash(password)

def verify(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp():
    otp = random.randint(100000,999999)
    return str(otp)

def store_otp(email: str, otp: str, expiration: int = 300):
    r.setex(f"otp:{email}", expiration, otp)

def get_stored_otp(email: str):
    return r.get(f"otp:{email}")

def delete_otp(email: str):
    r.delete(f"otp:{email}")

# add otp cooldown later

def send_otp_email(email: str, otp: str, subject: str):
    
    msg = EmailMessage()
    msg["Subject"] = f"{subject}"
    msg["From"] = f"{settings.email_Id}"
    msg["To"] = email
    
    msg.set_content(
        f"""
        The otp is {otp}.
        Do not tell this to anyone.
        It is valid only for 5 minutes.
        
        If you did not request this otp, please ignore this email.
        """ 
    )
        
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            
            server.login(f"{settings.email_Id}", f"{settings.email_id_app_password}")
            failed_recipients = server.send_message(msg)
            if failed_recipients:                
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email to the email id.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"some error occurred in starting the smtp server(check if your entered email is correct): {str(e)}")
        

        
def send_otp(email: str, subject: str = "Your OTP for Email Verification"):
    
    otp = generate_otp()
    store_otp(email, otp)
    
    try:
        send_otp_email(email, otp, subject)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected Error: {str(e)}")
    
    return {"msg": "otp sent successfully to your email"}



def is_token_denied(token_key: str):
    if r.exists(token_key):
        return True
    return False
    
def store_denied_token(token_key: str, expiration: int = 300):
    r.setex(token_key, expiration, "denied")

