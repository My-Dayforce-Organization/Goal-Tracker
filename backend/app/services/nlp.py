from __future__ import annotations

import re


class MockNLPService:
    def parse(self, text: str) -> dict:
        normalized = text.strip().lower()

        progress_value = None
        progress_match = re.search(r"(\d+)\s*%", normalized)
        if progress_match:
            progress_value = int(progress_match.group(1))
        else:
            generic_progress_match = re.search(r"progress\s*(?:to|at)?\s*(\d+)", normalized)
            if generic_progress_match:
                progress_value = int(generic_progress_match.group(1))

        status_value = None
        if "not started" in normalized or "not_started" in normalized:
            status_value = "not_started"
        elif "in progress" in normalized or "in_progress" in normalized:
            status_value = "in_progress"
        elif "overdue" in normalized:
            status_value = "overdue"
        elif "completed" in normalized or "complete" in normalized:
            status_value = "completed"

        milestone_id = None
        milestone_match = re.search(r"milestone\s+([a-zA-Z0-9_-]+)", normalized)
        if milestone_match:
            milestone_id = milestone_match.group(1)

        milestone_title = None
        for pattern in [
            r"update status of\s+(.+?)\s+to\s+.+",
            r"update\s+(.+?)\s+to\s+.+",
            r"progress of\s+(.+?)\s+to\s+.+",
        ]:
            match = re.search(pattern, normalized)
            if match:
                milestone_title = match.group(1).strip(' "\'')
                break

        ordinal_map = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5}
        milestone_index = None
        ordinal_match = re.search(r"(first|second|third|fourth|fifth)\s+milestone", normalized)
        if ordinal_match:
            milestone_index = ordinal_map[ordinal_match.group(1)]

        if progress_value is not None:
            if progress_value >= 100:
                status_value = "completed"
            elif progress_value <= 0:
                status_value = "not_started"
            elif status_value is None:
                status_value = "in_progress"

        if status_value == "completed" and progress_value is None:
            progress_value = 100

        return {
            "progress": progress_value,
            "status": status_value,
            "milestone_id": milestone_id,
            "milestone_title": milestone_title,
            "milestone_index": milestone_index,
        }
