from fastapi import FastAPI, Depends, HTTPException
from app.database.db import engine, Base
from sqlalchemy.orm import Session
from app.models.user import User
from app.database.session import get_db
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str

Base.metadata.create_all(bind = engine)
app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/users")
def create_user(email: str, hashed_password: str, db: Session = Depends(get_db)):
    new_user = User(email= email, hashed_password = hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

# register new users
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code = 400, detail = "Email already registered")
    
    new_user = User(email=user.email, hashed_password = hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

# authenticate users and return JWT token
@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user or not verify_password(user.password, existing_user.hashed_password):
        raise HTTPException(status_code = 401, detail="Invalid credentials")
    
    token = create_access_token({"sub": existing_user.email})
    return {"access_token": token, "token_type": "bearer"}

