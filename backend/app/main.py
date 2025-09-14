from fastapi import FastAPI
from . import models
from .database import engine
from .routers import Students, mark_attendance, create_user, auth, fetch_attendance, password_security, delete_account
from fastapi.middleware.cors import CORSMiddleware
from .config import settings

models.Base.metadata.create_all(bind=engine)

app=FastAPI()

app.include_router(Students.router)
app.include_router(mark_attendance.router)
app.include_router(create_user.router)
app.include_router(auth.router)
app.include_router(fetch_attendance.router)
app.include_router(password_security.router)
app.include_router(delete_account.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins = [f"{settings.dev_url}", f"{settings.prod_url}"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)