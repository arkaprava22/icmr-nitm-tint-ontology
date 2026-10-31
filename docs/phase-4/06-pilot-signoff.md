# Phase 4 Step 6: Pilot Sign-off

This step adds a formal pilot sign-off record to the protected evidence pack at
`/admin/pilot/evidence-pack`.

## What is captured

- Decision: approve expansion, conditional hold, or stop pilot.
- Sign-off authority or committee.
- Meeting or approval reference.
- Decision notes and conditions.
- Current pilot recommendation at the time of sign-off.
- Administrator who recorded the decision.

Each sign-off writes `PILOT_SIGNOFF_RECORDED` to the tamper-evident audit trail.
The latest sign-off is shown prominently, with earlier sign-offs retained as
history.
