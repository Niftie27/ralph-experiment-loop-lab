# Operating Model

RALPH runs as a set of bounded research loops.

Each loop has:

- trigger
- inputs
- read order
- actions
- outputs
- promotion criteria
- stop conditions
- safety boundaries

The loops should compound memory over time:

1. Source intake adds durable material.
2. Wiki synthesis makes it readable.
3. Unknowns identify missing evidence.
4. Discovery finds possible answers or candidates.
5. Investigation turns candidates into briefs.
6. Validation tests claims.
7. Decision records what to do next.
8. Self-improvement updates the loop rules.

Work items move through `automation/work-queues.yaml`. A loop should update the queue when it creates, starts, blocks, completes, watches, or discards an item.

The most important ordering rule is: discover and falsify strategy families before designing a trading bot architecture. Architecture follows a candidate strategy, not the other way around.
