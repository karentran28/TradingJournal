from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine, Base
from app.models import User, Trade, Strategy, JournalEntry, NotebookEntry  # registers all tables
from app.routes.auth import router as auth_router
from app.routes.trades import router as trades_router
from app.routes.strategies import router as strategies_router
from app.routes.journal import router as journal_router
from app.routes.notebook import router as notebook_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(trades_router)
app.include_router(strategies_router)
app.include_router(journal_router)
app.include_router(notebook_router)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Backend is running"}
