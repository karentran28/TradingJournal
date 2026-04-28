from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.auth import get_current_user
from app.models.strategy import Strategy
from app.schemas.strategy import StrategyCreate, StrategyUpdate

router = APIRouter(prefix="/strategies", tags=["strategies"])

@router.get("")
def get_strategies(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Strategy).filter(Strategy.user_id == current_user.id).all()

@router.post("")
def create_strategy(body: StrategyCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    s = Strategy(user_id=current_user.id, name=body.name, description=body.description)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.patch("/{strategy_id}")
def update_strategy(strategy_id: int, body: StrategyUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    s = db.query(Strategy).filter(Strategy.id == strategy_id, Strategy.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/{strategy_id}")
def delete_strategy(strategy_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    s = db.query(Strategy).filter(Strategy.id == strategy_id, Strategy.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db.delete(s)
    db.commit()
    return {"message": "Deleted"}
