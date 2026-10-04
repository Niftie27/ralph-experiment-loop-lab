# RALPH Decision Graph

This graph maps RALPH research loops, evidence sources, hypotheses, experiments, and strategy decisions.

It extends the global OpenClaw graph:

- global graph: `../openclaw-research-os/graph/decision-graph.json`
- RALPH graph: `decision-graph.json`

Validate with:

```bash
node ../openclaw-research-os/scripts/validate-decision-graph.mjs ralph-research-os/graph/decision-graph.json
```

Keep this graph conservative. It may route research and prepare proposals. It must not loosen live trading rules or execution risk without human approval.
