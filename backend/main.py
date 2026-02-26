from fastapi import FastAPI
from app.database.db import engine, Base
from app.routes.auth import router as auth_router
from app.routes.trades import router as trades_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(auth_router)
app.include_router(trades_router)
Base.metadata.create_all(bind = engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running"}

