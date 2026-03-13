from __future__ import annotations
import hashlib
import re
from dataclasses import dataclass


PII_PATTERNS = [r"[\w\.-]+@[\w\.-]+", r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"]


def redact_pii(text: str) -> tuple[str, dict]:
    redacted = text
    redactions = 0
    for pattern in PII_PATTERNS:
        redacted, count = re.subn(pattern, "[REDACTED]", redacted)
        redactions += count
    return redacted, {"redaction_count": redactions}


@dataclass
class ParseResult:
    summary: str
    confidence: float


class MockNLPService:
    def parse(self, text: str) -> ParseResult:
        lowered = text.lower()
        if "completed" in lowered or "finished" in lowered:
            return ParseResult(summary="Detected completion update", confidence=0.8)
        return ParseResult(summary="Detected generic update", confidence=0.72)


class LLMAdapter:
    def parse(self, text: str) -> ParseResult:
        redacted, _ = redact_pii(text)
        # Placeholder for real external call
        return MockNLPService().parse(redacted)


def content_hash(user_id: int, text: str) -> str:
    return hashlib.sha256(f"{user_id}:{text.strip().lower()}".encode()).hexdigest()