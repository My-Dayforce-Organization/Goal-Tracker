from __future__ import annotations

import re


class MockNLPService:
    def parse(self, text: str) -> tuple[int, str | None]:
        normalized = text.lower()
        progress_delta = 0
        for pattern in [r"(\d+)\s*%", r"progress\s*(?:to|at)?\s*(\d+)"]:
            match = re.search(pattern, normalized)
            if match:
                progress_delta = int(match.group(1))
                break
        milestone_id = None
        milestone_match = re.search(r"milestone\s+([a-zA-Z0-9_-]+)", normalized)
        if milestone_match:
            milestone_id = milestone_match.group(1)
        return progress_delta, milestone_id
