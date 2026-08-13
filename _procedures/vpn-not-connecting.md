---
title: Resolve VPN connection failure
slug: vpn-not-connecting
description: 'Diagnose internet, DNS, client, credential and gateway causes without unnecessary reinstallation or certificate removal.'
content_type: procedure
category: Network & Connectivity
severity: medium
support_tier: L1-L2
estimated_time: 15-30 mins
owner_team: Network Operations
tags:
  - vpn
  - remote-work
  - dns
  - connectivity
error_codes:
  - authentication failed
  - gateway unavailable
  - connection timed out
tldr: 'Confirm public internet access, system time, DNS and gateway reachability, restart only the approved VPN client service, then isolate local-network versus corporate-gateway scope.'
related_symptoms:
  - vpn-fails
related_causes:
  - vpn-client-state
next_steps:
  - password-reset
escalation: 'Escalate to Network Operations if the gateway is unreachable from multiple networks, authentication fails after identity validation, the managed client profile is corrupt, or multiple users report the same VPN outage.'
risk_model: impact-v1
risk_basis: 'Batch B-1 audit classification: P2 / medium.'
verification_priority: P2
last_reviewed: 2026-08-10T00:00:00.000Z
permalink: /procedures/vpn-not-connecting/
layout: article
content_status: verified
generated_baseline: false
reviewed_by: ShiftStart technical review
last_tested: ''
tested_platforms: []
source_references:
  - 'https://learn.microsoft.com/powershell/module/dnsclient/resolve-dnsname'
  - 'https://learn.microsoft.com/powershell/module/nettcpip/test-netconnection'
change_record: Standardised to the Enterprise runbook template; existing verified status retained pending recorded live revalidation evidence.
quality_gate: passed
runbook_template: enterprise-v1
verification_evidence_state: legacy_verified_pending_revalidation
verification_schema_version: 2
verification_governance_state: revalidation_required
verification_v2_complete: false
verification_v2_score_percent: 18
verification_v2_missing:
  - diagnostic_tested
  - remediation_tested
  - rollback_or_irreversibility_confirmed
  - escalation_confirmed
  - time_validated
  - expected_result_confirmed
  - owner_signoff
  - authoritative_source_provenance
  - tested_platforms
  - last_tested
  - minimum_peer_reviewers
  - minimum_sme_reviewers
  - minimum_test_records
  - minimum_distinct_environments
verification_promotion_ready: false
classification_audit: batch-b1-2026-08-13
---
## Mandatory Batch B-1 controls
These audit-derived controls are mandatory before more invasive remediation.

### Pre-checks
1. Determine scope first: one endpoint, one platform, multiple users or gateway-wide.
2. Check provider/gateway service health before client remediation.
3. Check Conditional Access/NAC/identity blocks before deleting profiles or certificates.

### Rollback / undo
- This procedure is a triage parent; do not perform destructive profile/certificate changes here. Route to the child runbook that owns rollback.

## Parent triage decision path
Use this procedure to identify the failing VPN layer. Do not use it as a catch-all remediation runbook.

1. **Determine scope.**
   - One Linux endpoint → `troubleshoot-linux-vpn`
   - One macOS endpoint → `troubleshoot-macos-vpn`
   - One mobile endpoint → `troubleshoot-mobile-vpn`
   - Certificate-specific failure → `troubleshoot-vpn-certificate-failure`
   - Repeated disconnects → `troubleshoot-vpn-disconnections`
   - Slow performance → `troubleshoot-slow-vpn-performance`
   - Multiple users / cloud gateway issue → `troubleshoot-a-cloud-vpn-gateway`

2. **Check service/gateway health before client changes.**
3. **Check basic endpoint prerequisites:** public internet, time, DNS, gateway reachability, approved client version and exact error.
4. **Check identity/policy blocks:** Conditional Access, NAC, disabled account or expired certificate.
5. **Route to the child runbook.** Do not delete certificates, managed profiles or authentication material here.

## Verification Steps
1. The correct child/gateway runbook is selected from observed evidence.
2. Scope is documented as single endpoint, platform-specific, multi-user or gateway-wide.
3. The child runbook owns remediation, rollback and live verification.

## Escalation Path
Escalate to Network Operations when multiple users/networks are affected, the gateway is unhealthy/unreachable, or evidence points to a gateway/provider issue.
