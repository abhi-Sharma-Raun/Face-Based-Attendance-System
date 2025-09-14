from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from .. import utils, schemas, oauth2, models
from ..database import get_db
from datetime import datetime, timezone

router = APIRouter(
    tags = ["Delete Account"]
)

@router.delete("/delete_account", status_code=status.HTTP_200_OK)
def delete_User(db: Session =Depends(get_db), current_user: schemas.verifiedToken = Depends(oauth2.get_current_user)):
    
    try:
        current_user_id = current_user.id
        token_id = current_user.token_id
        expire_time = current_user.expiration_time.timestamp()
    
        user_query = db.query(models.Users).filter(models.Users.user_id == current_user_id)
    
        if not user_query.first():
            raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "User not found")
    
        user_query.delete(synchronize_session=False)
        db.commit()
    
        current_time = datetime.now(timezone.utc).timestamp()
    
        time_to_live = max(0, int(expire_time - current_time))
    
        if time_to_live > 0:
            utils.store_denied_token(token_id, time_to_live)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected Error: {str(e)}")
    
    return {"msg": "Account deleted successfully"}
    