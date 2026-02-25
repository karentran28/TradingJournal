from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.database.session import get_db
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.auth import get_current_user
from app.schemas.user import UserCreate

router = APIRouter(tags=["auth"])

@router.post("/users")
def create_user(email: str, hashed_password: str, db: Session = Depends(get_db)):
    new_user = User(email= email, hashed_password = hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

# register new users
@router.post("/signup")
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
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_me(user = Depends(get_current_user)):
    return {"email": user.email}