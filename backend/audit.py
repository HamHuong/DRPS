from sqlalchemy.orm import Session
from datetime import datetime
import models

def log_audit(db: Session, user_id: int, action: str, resource: str, payload: dict = None):
    """
    Ghi lại nhật ký hệ thống (Audit Log).
    """
    try:
        new_log = models.AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            payload=payload or {}
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"Error saving audit log: {e}")
        db.rollback()
