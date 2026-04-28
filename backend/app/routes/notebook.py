from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.auth import get_current_user
from app.models.notebook import NotebookEntry
from app.schemas.notebook import NotebookCreate, NotebookUpdate

router = APIRouter(prefix="/notebook", tags=["notebook"])

@router.get("")
def get_entries(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(NotebookEntry).filter(NotebookEntry.user_id == current_user.id).order_by(NotebookEntry.updated_at.desc()).all()

@router.post("")
def create_entry(body: NotebookCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = NotebookEntry(user_id=current_user.id, title=body.title, content=body.content)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.patch("/{entry_id}")
def update_entry(entry_id: int, body: NotebookUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.query(NotebookEntry).filter(NotebookEntry.id == entry_id, NotebookEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.query(NotebookEntry).filter(NotebookEntry.id == entry_id, NotebookEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}
