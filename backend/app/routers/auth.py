from fastapi import Depends, APIRouter, status, HTTPException
from ..database import get_db
from .. import models, schemas, oauth2, utils
from sqlalchemy.orm import Session
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from datetime import datetime, timezone

router = APIRouter(
    tags=["Authentication"]
)


@router.post("/login")
def login(user_credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    
    try:
        user = db.query(models.Users).filter(models.Users.email == user_credentials.email).first()
    
        if not user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    
        if not utils.verify(user_credentials.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    
        access_token = oauth2.create_access_token(data={"user_id":user.user_id})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")    
        
    return {"access_token": access_token, "token_type": "bearer"}
    
@router.post("/logout")
def logout(current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)):
    
    try:      
        token_id = current_user.token_id  
        expire_time = current_user.expiration_time.timestamp()
    
        current_time = datetime.now(timezone.utc).timestamp()
    
        time_to_live = max(0, int(expire_time - current_time))
    
        if time_to_live > 0:
            utils.store_denied_token(token_id, time_to_live)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected Error: {str(e)}")
    
    return {"msg": "User logged out successfully"}
    
    