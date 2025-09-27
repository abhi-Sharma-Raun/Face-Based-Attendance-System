from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    database_username: str
    database_password: str
    database_hostname: str
    database_port: int
    database_name: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    email_Id: str
    email_id_app_password: str
    redis_host: str
    redis_port: int
    dev_url_1: str
    dev_url_2: str
    prod_url: str
    face_attendance_similarity_threshold: float
    eye_mouth_thresh: float
    eye_angle_thresh: float
    jawline_symmetry_thresh: float
    nose_mouth_ratio_lower: float
    nose_mouth_ratio_upper: float
    class Config:
        env_file = ".env"
        
settings = Settings()