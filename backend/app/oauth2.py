from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from . import schemas, utils
import uuid
from .config import settings

ACCESS_TIME_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
ALGORITHM = f"{settings.ALGORITHM}"
SECRET_KEY = f"{settings.SECRET_KEY}"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()
    jti = str(uuid.uuid4())
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TIME_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    to_encode.update({"jti": jti})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)
    
    return encoded_jwt

def verify_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        id: str = payload.get("user_id")
        jti = payload.get("jti")
        expire_time = payload.get("exp")
        if not id or not jti:
            raise credentials_exception
        
        if utils.is_token_denied(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Token is denied",
                                headers={"WWW-Authenticate": "Bearer"})
        exp_ts = datetime.fromtimestamp(expire_time, timezone.utc)
        
        result = schemas.verifiedToken(id=id, token_id=jti, expiration_time=exp_ts)
    except JWTError:
        raise credentials_exception
    return result

def get_current_user(token: str = Depends(oauth2_scheme)):
    
    credentials_exception = HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail = "could not validate credentials",
                                          headers = {"WWW-Authenticate": "Bearer"})
    return verify_access_token(token, credentials_exception)