from prometheus_client import Counter

nl_tokens = Counter('llm_tokens_total', 'LLM tokens', ['org_id'])
