from fastapi import FastAPI
from app.database.db import engine, Base
from app.routes.auth import router as auth_router
from app.routes.trades import router as trades_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(trades_router)
Base.metadata.create_all(bind = engine)

@app.get("/")
def root():
    return {"message": "Backend is running"}
