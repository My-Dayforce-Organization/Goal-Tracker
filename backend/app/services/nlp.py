from __future__ import annotations

import re


class MockNLPService:
    def parse(self, text: str) -> dict:
        normalized = text.strip().lower()

        progress_value = None
        for pattern in [r"(\d+)\s*%", r"progress\s*(?:to|at)?\s*(\d+)"]:
            match = re.search(pattern, normalized)
            if match:
                progress_value = int(match.group(1))
                break

        status_value = None
        status_match = re.search(r"(?:status\s*(?:of)?\s*.+?\s*to\s*)(completed|in[_\s]?progress|overdue|not[_\s]?started)", normalized)
        if status_match:
            raw = status_match.group(1).replace(" ", "_")
            status_value = {
                "completed": "completed",
                "in_progress": "in_progress",
                "overdue": "overdue",
                "not_started": "not_started",
            }.get(raw)

        milestone_id = None
        milestone_match = re.search(r"milestone\s+([a-zA-Z0-9_-]+)", normalized)
        if milestone_match:
            milestone_id = milestone_match.group(1)

        title_match = re.search(r"status\s+of\s+(.+?)\s+to\s+(completed|in[_\s]?progress|overdue|not[_\s]?started)", normalized)
        milestone_title = title_match.group(1).strip() if title_match else None

        return {
            "progress": progress_value,
            "status": status_value,
            "milestone_id": milestone_id,
            "milestone_title": milestone_title,
        }
