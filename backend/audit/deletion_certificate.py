from datetime import datetime

def generate_certificate(user_id: int, subject: str) -> dict:
    return {
        "certificate_id": f"del-{user_id}-{int(datetime.utcnow().timestamp())}",
        "subject": subject,
        "deleted_at_utc": datetime.utcnow().isoformat(),
        "status": "certified"
    }
