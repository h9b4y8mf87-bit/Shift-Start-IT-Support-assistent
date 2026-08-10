---
title: Resolve VPN connection failure
slug: vpn-not-connecting
description: 'Diagnose internet, DNS, client, credential and gateway causes without unnecessary reinstallation or certificate removal.'
content_type: procedure
category: Network & Connectivity
severity: high
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
risk_basis: High impact - a remote user can be unable to perform core work and a gateway issue may represent wider service degradation.
verification_priority: P1
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
verification_v2_score_percent: 17
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
  - negative_path_tested
verification_promotion_ready: false
---
## Diagnostic Steps
1. Confirm the user can browse a public website without the VPN and that airplane mode is off.
2. Confirm date, time and time zone are correct.

{% capture kb_command_1 %}
Get-Date
w32tm /query /status
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell" command=kb_command_1 %}

3. Resolve and test the configured VPN gateway.

{% capture kb_command_2 %}
Resolve-DnsName vpn.example.com
Test-NetConnection vpn.example.com -Port 443
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell" command=kb_command_2 %}

4. Record the VPN client version, exact error and timestamp.
5. Test from a mobile hotspot or another approved network to distinguish local ISP/router restrictions from the corporate VPN service.

## Remediation Steps
1. Fully exit the approved VPN client.
2. Restart only the approved VPN client service.
3. Reconnect using the managed profile.
4. Do not clear certificates, tokens or managed profiles unless the product-specific runbook explicitly requires it.

## Rollback Steps
1. If a service restart does not help, leave the service in its normal running state.
2. If an approved profile repair causes regression, restore the managed profile from the authorised configuration source.
3. Do not restore or import untrusted certificate material.

## Verification Steps
1. Connect the VPN successfully.
2. Open one approved internal service.
3. Confirm the expected corporate route or assigned VPN address.
4. Disconnect and reconnect once to confirm the result is repeatable.

## Escalation Path
1. Escalate to Network Operations if the gateway is unreachable from multiple networks, multiple users are affected, authentication still fails after identity validation, or the managed client profile is damaged.
2. Include user, public IP, VPN client version, gateway, timestamp, exact error, approved log bundle and DNS/reachability results.
