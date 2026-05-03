'''
import random
from passlib.context import CryptContext
import redis
import smtplib
from fastapi import HTTPException, status
from email.message import EmailMessage
from .config import settings
import os


redis_host = os.environ.get("REDIS_HOST")
redis_port = int(os.environ.get("REDIS_PORT", 6379))

r = None

if redis_host:
    try:
        redis_host = os.environ.get("REDIS_HOST")
        redis_port = int(os.environ.get("REDIS_PORT", 6379))

        r = redis.Redis(host=redis_host, port=redis_port)
    except redis.exceptions.ConnectionError as e:
        print(f"Error: Could not connect to Redis. {e}")
        r = None
      

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash(password: str):
    return pwd_context.hash(password)

def verify(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp():
    otp = random.randint(100000,999999)
    return str(otp)

def store_otp(email: str, otp: str, expiration: int = 300):
    if not r:
        raise Exception("Redis client not initialized.")
    r.setex(f"otp:{email}", expiration, otp)

def get_stored_otp(email: str):
    if not r:
        raise Exception("Redis client not initialized.")
    return r.get(f"otp:{email}")

def delete_otp(email: str):
    if not r:
        raise Exception("Redis client not initialized.")
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
    if not r:
        raise Exception("Redis client not initialized.")
    if r.exists(token_key):
        return True
    return False
    
def store_denied_token(token_key: str, expiration: int = 300):
    if not r:
        raise Exception("Redis client not initialized.")
    r.setex(token_key, expiration, "denied")
''' 
'''
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
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            
            server.login(f"{settings.email_Id}", f"{settings.email_id_app_password}")
            failed_recipients = server.send_message(msg)
            if failed_recipients:                
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email to the email id.")
'''
import random
from passlib.context import CryptContext
import redis
import smtplib
from fastapi import HTTPException, requests, status
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .config import settings

r = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    decode_responses=True,
    username="default",
    password=settings.redis_password,
)
try:
    sg = SendGridAPIClient(settings.sendgrid_api_key)
except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error initializing SendGrid client: {str(e)}")


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

def send_otp_email(email_id: str, otp: str, subject: str):
    
    email_content=f"""
        The otp is {otp}.
        Do not tell this to anyone.
        It is valid only for 5 minutes.
        
        If you did not request this otp, please ignore this email.
        """ 
        
    message = Mail(
        from_email=settings.from_email_Id,
        to_emails=email_id,
        subject=subject,
        html_content=f'<strong>{email_content}</strong>')
        
    try:
        response = sg.send(message)
        print(response.status_code)
        
    except Exception as e:
        print("Problem")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"some error occurred: {str(e)}")
        

        
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

