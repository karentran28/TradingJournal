from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database.session import get_db
from app.utils.auth import get_current_user
from app.models.journal import JournalEntry
from app.schemas.journal import JournalCreate, JournalUpdate

router = APIRouter(prefix="/journal", tags=["journal"])

@router.get("")
def get_entries(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).order_by(JournalEntry.entry_date.desc()).all()

@router.post("")
def create_entry(body: JournalCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = JournalEntry(
        user_id=current_user.id,
        title=body.title,
        content=body.content,
        entry_date=body.entry_date or date.today(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.patch("/{entry_id}")
def update_entry(entry_id: int, body: JournalUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}
