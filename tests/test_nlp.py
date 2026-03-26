from backend.services.nlp import MockNLPService


def test_parser_seed_accuracy():
    utterances = [
        "I completed reading 12 Rules for Life today",
        "finished my python architecture chapter",
        "completed workshop prep",
        "I finished sprint planning",
        "done mentoring session",
        "finished my speech practice",
        "completed coaching module",
        "I finished review docs",
        "completed task",
        "finished milestone",
    ]
    svc = MockNLPService()
    positives = sum(1 for u in utterances if svc.parse(u).confidence >= 0.7)
    assert positives / len(utterances) >= 0.9
