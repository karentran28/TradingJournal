from app.database.db import SessionLocal

def get_db():
    # creates a new session
    db = SessionLocal()
    try:
        # FastAPI gives this session to the route
        yield db
    finally:
        # ensures session always closes
        db.close()

