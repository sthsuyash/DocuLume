"""Structured audit logging for security-sensitive operations."""

import json
from datetime import datetime, timezone
from typing import Optional, Any
from app.utils.logger import logger


def _emit(event: str, actor_id: Optional[int], target: Optional[str], extra: dict[str, Any]) -> None:
    record = {
        "audit": True,
        "event": event,
        "actor_id": actor_id,
        "target": target,
        "ts": datetime.now(timezone.utc).isoformat(),
        **extra,
    }
    logger.info(json.dumps(record))


async def emit_db(
    db: Any,
    event: str,
    actor_id: Optional[int],
    target: Optional[str] = None,
    ip_address: Optional[str] = None,
    extra: Optional[dict] = None,
) -> None:
    """Write an audit event to the database. Fails silently so it never breaks a request."""
    try:
        from app.models.audit_log import AuditLog
        log = AuditLog(
            user_id=actor_id,
            event=event,
            target=target,
            ip_address=ip_address,
            extra=extra,
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        logger.warning(f"DB audit write failed: {e}")


# ── Auth events ──────────────────────────────────────────────────────────────

def log_login_success(user_id: int, email: str, ip: str) -> None:
    _emit("auth.login.success", user_id, email, {"ip": ip})


def log_login_failure(email: str, ip: str, reason: str) -> None:
    _emit("auth.login.failure", None, email, {"ip": ip, "reason": reason})


def log_logout(user_id: int, ip: str) -> None:
    _emit("auth.logout", user_id, None, {"ip": ip})


def log_register(user_id: int, email: str, ip: str) -> None:
    _emit("auth.register", user_id, email, {"ip": ip})


def log_oauth_login(user_id: int, provider: str, ip: str) -> None:
    _emit("auth.oauth.login", user_id, None, {"provider": provider, "ip": ip})


# ── Document events ───────────────────────────────────────────────────────────

def log_document_upload(user_id: int, document_id: int, filename: str, size_bytes: int) -> None:
    _emit("document.upload", user_id, filename, {"document_id": document_id, "size_bytes": size_bytes})


def log_document_delete(actor_id: int, document_id: int, owner_id: int, filename: str) -> None:
    _emit("document.delete", actor_id, filename, {"document_id": document_id, "owner_id": owner_id})


def log_document_bulk_delete(actor_id: int, document_ids: list[int], count: int) -> None:
    _emit("document.bulk_delete", actor_id, None, {"document_ids": document_ids, "count": count})


# ── Admin events ──────────────────────────────────────────────────────────────

def log_admin_role_change(admin_id: int, target_user_id: int, new_role: str) -> None:
    _emit("admin.user.role_change", admin_id, str(target_user_id), {"new_role": new_role})


def log_admin_user_delete(admin_id: int, target_user_id: int, target_email: str) -> None:
    _emit("admin.user.delete", admin_id, target_email, {"target_user_id": target_user_id})


def log_admin_document_delete(admin_id: int, document_id: int) -> None:
    _emit("admin.document.delete", admin_id, str(document_id), {"document_id": document_id})


def log_admin_bulk_document_delete(admin_id: int, document_ids: list[int], count: int) -> None:
    _emit("admin.document.bulk_delete", admin_id, None, {"document_ids": document_ids, "count": count})
