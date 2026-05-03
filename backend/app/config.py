from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    database_role: str
    database_hostname: str
    database_name: str
    database_region: str
    database_password: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    from_email_Id: str
    redis_host: str
    redis_port: int
    redis_password: str
    sendgrid_api_key: str
    dev_url_1: str
    dev_url_2: str
    prod_url1: str
    prod_url2: str
    face_attendance_similarity_threshold: float
    eye_mouth_thresh: float
    eye_angle_thresh: float
    jawline_symmetry_thresh: float
    nose_mouth_ratio_lower: float
    nose_mouth_ratio_upper: float
    class Config:
        env_file = ".env"
        
settings = Settings()