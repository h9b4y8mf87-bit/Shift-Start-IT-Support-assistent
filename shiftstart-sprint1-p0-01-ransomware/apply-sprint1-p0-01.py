#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil, sys

repo = Path.cwd()
patch = Path(__file__).resolve().parent
payload = patch / "payload"
procedure = repo / "_procedures/respond-to-a-ransomware-alert.md"

if not procedure.exists():
    raise SystemExit("ERROR: Run from the ShiftStart repository root; ransomware procedure not found.")

text = procedure.read_text(encoding="utf-8")
required_markers = [
    "title: Respond to a ransomware alert",
    "verification_priority: P0",
    "content_status: under_review",
    "Ask the user to demonstrate the original task or reproduce it with non-sensitive test data.",
]
missing = [m for m in required_markers if m not in text]
if missing:
    print("ERROR: Procedure differs from expected Sprint 1 baseline.", file=sys.stderr)
    for m in missing: print("Missing marker:", m, file=sys.stderr)
    raise SystemExit(1)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = repo / ".shiftstart-backups" / f"sprint1-p0-01-{stamp}" / procedure.relative_to(repo)
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(procedure, backup)

# Real provenance only. This is source evidence, not live execution evidence.
if "\nsource_provenance:\n" not in text:
    anchor = "source_references: []\n"
    provenance = """source_references: []\nsource_provenance:\n  - publisher: CISA\n    title: '#StopRansomware Guide'\n    url: https://www.cisa.gov/stopransomware/ransomware-guide\n    retrieved_at: '2026-08-10'\n    authoritative: true\n  - publisher: Microsoft\n    title: Responding to ransomware attacks - Microsoft Defender XDR\n    url: https://learn.microsoft.com/en-us/defender-xdr/playbook-responding-ransomware-m365-defender\n    retrieved_at: '2026-08-10'\n    authoritative: true\n  - publisher: Microsoft\n    title: Take response actions on a device - Microsoft Defender for Endpoint\n    url: https://learn.microsoft.com/en-us/defender-endpoint/respond-machine-alerts\n    retrieved_at: '2026-08-10'\n    authoritative: true\n  - publisher: NIST\n    title: 'NIST IR 8374 Rev. 1 - Ransomware Risk Management: A Cybersecurity Framework 2.0 Community Profile'\n    url: https://csrc.nist.gov/pubs/ir/8374/r1/final\n    retrieved_at: '2026-08-10'\n    authoritative: true\n"""
    if anchor not in text:
        raise SystemExit("ERROR: source_references marker not found.")
    text = text.replace(anchor, provenance, 1)

text = text.replace(
"""- Protect unsaved work and business data before restarts, profile resets, re-enrolment, removal, wipe, restore or replacement actions.
- Use named administrative accounts and approved privileged-access workflows. Never request or record a user's password or MFA code.
- Stop when there is a safety risk, suspected security incident, legal hold, active major incident, unsupported device, data-loss risk or action outside your authority.""",
"""- Treat a credible ransomware alert as a security incident. Containment and evidence preservation take precedence over preserving unsaved user work.
- Establish approved secure or out-of-band communication with Security Operations / Incident Response when compromise may still be active.
- Use named administrative accounts and approved privileged-access workflows. Never request or record a user's password or MFA code.
- Never ask the user to re-open a suspicious attachment, execute a suspected payload or reproduce ransomware behaviour.
- Stop when there is a safety risk, legal hold, unsupported device, data-loss risk or action outside your authority; escalate immediately through the incident-response process."""
)

text = text.replace(
"""### Targeted checks
- Do not delete messages/files or run unapproved cleanup; preserve timestamps, headers, alerts and user account/device details.
- Determine whether credentials were entered, content opened, data sent or execution occurred.

### Targeted remediation sequence
1. Contain through approved SOC actions and follow the incident commander’s instructions.
2. Do not reconnect or return a contained device without security approval.""",
"""### Targeted checks
- Determine which systems, identities, services and network paths are affected from alerts, EDR/SIEM telemetry, identity events, email evidence and network logs.
- Do not delete messages/files or run unapproved cleanup; preserve timestamps, headers, alerts, volatile evidence where feasible, and user/account/device details.
- Determine whether credentials were exposed, content opened, data exfiltrated, malicious execution occurred or lateral movement is still active.
- Do not execute or re-execute suspected ransomware to reproduce the alert.

### Targeted remediation sequence
1. Immediately contain affected systems through approved incident-response/SOC actions. Isolate compromised endpoints from the network where appropriate.
2. Preserve compromised systems for analysis. Do not shut them down merely for convenience; if network disconnection is impossible, follow the approved incident-response decision for power-down and record the evidence impact.
3. Contain compromised identities, remote sessions, malicious indicators and attacker communication paths as directed by Security Operations.
4. Do not reconnect, restore or return a contained device/service until Security Operations confirms that investigation and mitigation are complete."""
)

old_step1 = """1. **Confirm the report and reproduce safely.** Ask the user to demonstrate the original task or reproduce it with non-sensitive test data. Do not repeatedly trigger lockouts, failed jobs, duplicate transactions or destructive actions.

   <div class="expected"><strong>Expected result:</strong> The ticket contains a precise, reproducible statement of the failure and its business impact.</div>"""
new_step1 = """1. **Confirm and declare the incident without reproducing the payload.** Validate the ransomware alert using the original alert, timestamps, affected asset/account, EDR/SIEM evidence and user report. Do **not** ask the user to reopen suspicious content or execute the suspected payload. Establish secure incident-response communications and link the alert to an existing incident or declare a new ransomware incident.

   <div class="expected"><strong>Expected result:</strong> The incident record contains the triggering evidence, first-seen time, affected entities, business impact and incident owner without re-executing suspicious content.</div>"""
text = text.replace(old_step1, new_step1, 1)

old_step2 = """2. **Determine scope and priority.** Compare another user, device, location or service path where safe. Check monitoring, service-health notices, known errors, major incidents and recent changes.

   <div class="expected"><strong>Expected result:</strong> The issue is correctly classified as local, user-specific, device-specific, site-specific, service-wide or a standard request.</div>"""
new_step2 = """2. **Determine scope and prioritise containment.** Identify impacted and at-risk devices, user/service accounts, applications, network communications, payloads and possible originating/spreader systems. Prioritise isolation of affected entities while investigation continues.

   <div class="expected"><strong>Expected result:</strong> The response team has an evidence-based scope hypothesis and the highest-risk affected entities are contained or queued for approved containment.</div>"""
text = text.replace(old_step2, new_step2, 1)

old_step3 = """3. **Protect data and establish a rollback point.** Save work, record current settings and export or back up configuration where supported. Obtain approval before actions that can interrupt service or remove data.

   <div class="expected"><strong>Expected result:</strong> Current state and recovery options are documented before any material change.</div>"""
new_step3 = """3. **Preserve evidence and record reversible containment state.** Record the current incident/device/account state and collect approved forensic or investigation evidence before cleanup where feasible. Do not delay urgent containment merely to save user work. Record how each containment action can be released or reversed and obtain approval for high-impact actions.

   <div class="expected"><strong>Expected result:</strong> Volatile/high-value evidence is preserved where feasible, containment is not unnecessarily delayed, and reversal/release conditions are documented.</div>"""
text = text.replace(old_step3, new_step3, 1)

text = text.replace(
"""4. **Run non-destructive diagnostics.** Preserve evidence and review the approved EDR, identity, email, network and device telemetry without deleting artefacts or alerting a suspected attacker unnecessarily.""",
"""4. **Collect incident evidence and non-destructive diagnostics.** Review the approved EDR/SIEM incident, device timeline, identity activity, email evidence, network telemetry and available investigation package. Preserve artefacts and avoid cleanup until the incident owner authorises eradication."""
)

text = text.replace(
"""5. **Apply the primary approved remediation.** Contain through approved controls such as account session revocation, message quarantine or endpoint isolation; do not improvise destructive actions.

   <div class="expected"><strong>Expected result:</strong> The affected component returns to a supported, known-good state with minimal user or service disruption.</div>""",
"""5. **Apply approved containment.** Use authorised controls such as endpoint isolation, compromised-account/session containment, indicator blocking, message quarantine or equivalent SOC actions. For critical infrastructure, assess service impact and use the approved containment method rather than improvising destructive changes.

   <div class="expected"><strong>Expected result:</strong> Attack propagation and unauthorised access paths are constrained, the containment action is visible in the relevant control plane, and evidence remains available for investigation.</div>"""
)

text = text.replace(
"""6. **Re-test the original task.** Repeat the exact business action using the same account, device, network and data path. Also test a controlled alternative where useful.

   <div class="expected"><strong>Expected result:</strong> The original failure is resolved or the remaining fault is narrowed to a specific dependency.</div>""",
"""6. **Verify containment without re-triggering ransomware.** Confirm isolation/containment status, loss of unauthorised network paths, preservation of Defender/EDR management connectivity where applicable, and that related alerts or lateral movement are no longer progressing. Do not re-run the suspected ransomware payload as a verification step.

   <div class="expected"><strong>Expected result:</strong> The incident owner confirms containment is effective and investigation can continue without new propagation from the affected entity.</div>"""
)

text = text.replace(
"""9. **Complete end-to-end verification.** The incident owner confirms containment, required evidence is preserved and the affected service or device is returned only after security approval.

   <div class="expected"><strong>Expected result:</strong> The user or service owner confirms the business task is restored and monitoring remains stable.</div>""",
"""9. **Complete end-to-end security verification before release.** The incident owner confirms containment, eradication/recovery criteria, required evidence preservation and monitoring results. Release isolation or return a device/service only after the approved security decision.

   <div class="expected"><strong>Expected result:</strong> Security Operations confirms the entity can safely return to service, the business owner confirms restoration where applicable, and monitoring shows no continuing ransomware activity.</div>"""
)

procedure.write_text(text,encoding="utf-8")
print("Updated:", procedure.relative_to(repo))

# Copy source review and test plan.
for src in payload.rglob("*"):
    if not src.is_file(): continue
    rel = src.relative_to(payload)
    dst = repo / rel
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
    print("Installed:",rel)

# Create a blank evidence work-item only if Batch A generator hasn't already created one.
evidence = repo / "verification/evidence/pending/respond-to-a-ransomware-alert.yml"
if not evidence.exists():
    evidence.parent.mkdir(parents=True,exist_ok=True)
    evidence.write_text("""schema_version: 1
procedure:
  slug: respond-to-a-ransomware-alert
  title: Respond to a ransomware alert
  priority: P0
  category: Security & Compliance
  queue_rank: 1
  batch: A
status: in_test
tester:
  name: ''
  role: ''
  organisation: ''
test_started_at: ''
test_completed_at: ''
environment_notes: ''
verification_evidence:
  diagnostic_tested: false
  remediation_tested: false
  rollback_confirmed: false
  irreversible_change: false
  irreversibility_approved_by: ''
  stop_conditions_confirmed: false
  escalation_confirmed: false
  time_validated: false
  expected_result_confirmed: false
  negative_path_tested: false
  owner_signoff: ''
  peer_reviewers: []
  test_environments: []
source_provenance:
  - publisher: CISA
    title: '#StopRansomware Guide'
    url: https://www.cisa.gov/stopransomware/ransomware-guide
    retrieved_at: '2026-08-10'
    authoritative: true
  - publisher: Microsoft
    title: Responding to ransomware attacks - Microsoft Defender XDR
    url: https://learn.microsoft.com/en-us/defender-xdr/playbook-responding-ransomware-m365-defender
    retrieved_at: '2026-08-10'
    authoritative: true
  - publisher: Microsoft
    title: Take response actions on a device - Microsoft Defender for Endpoint
    url: https://learn.microsoft.com/en-us/defender-endpoint/respond-machine-alerts
    retrieved_at: '2026-08-10'
    authoritative: true
  - publisher: NIST
    title: 'NIST IR 8374 Rev. 1 - Ransomware Risk Management: A Cybersecurity Framework 2.0 Community Profile'
    url: https://csrc.nist.gov/pubs/ir/8374/r1/final
    retrieved_at: '2026-08-10'
    authoritative: true
tested_platforms: []
actual_duration_minutes:
observations: 'Authoritative source review completed. Live/sandbox execution evidence is still required.'
defects_found:
  - RANSOM-001
  - RANSOM-002
  - RANSOM-003
blockers: 'Requires three authorised representative test environments and two independent SME reviewers.'
evidence_attachments: []
declaration:
  actual_test_performed: false
  evidence_is_not_fabricated: true
""",encoding="utf-8")
    print("Created:", evidence.relative_to(repo))
else:
    print("Existing evidence work-item preserved:", evidence.relative_to(repo))
    print("Use verification/sprint-1/respond-to-a-ransomware-alert-source-review.yml to merge the source review without overwriting tester data.")

# Safety assertions.
updated = procedure.read_text(encoding="utf-8")
must_have = [
    "Never ask the user to re-open a suspicious attachment",
    "Confirm and declare the incident without reproducing the payload",
    "Verify containment without re-triggering ransomware",
    "source_provenance:",
]
for marker in must_have:
    if marker not in updated:
        raise SystemExit("ERROR: expected correction missing: "+marker)
if "Ask the user to demonstrate the original task or reproduce it with non-sensitive test data." in updated:
    raise SystemExit("ERROR: unsafe generic reproduction instruction still present.")

print("")
print("Sprint 1 P0-01 source review and safety correction applied.")
print("NO live test fields were marked passed.")
print("NO procedure was promoted to Verified.")
print("Next: execute the three-environment test plan and capture real evidence.")
