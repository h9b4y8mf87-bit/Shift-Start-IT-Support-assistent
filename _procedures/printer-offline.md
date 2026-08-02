---
title: Printer shows Offline
slug: printer-offline
description: Restore printing by checking reachability, queue state, port and spooler health.
content_type: procedure
category: Printing & Scanning
severity: low
tags:
- printer
- spooler
- queue
- tcp-ip
error_codes:
- Printer Offline
- Error - Printing
tldr: Confirm the printer is reachable, clear stuck jobs, disable 'Use Printer Offline', then restart the Print Spooler.
related_symptoms:
- printer-offline-symptom
related_causes:
- stuck-print-queue
next_steps: []
escalation: Escalate to Desktop or Print Services with printer name, IP, site, queue screenshot, ping result, port configuration and spooler restart result.
last_reviewed: 2026-08-02
permalink: /procedures/printer-offline/
layout: article
content_status: verified
generated_baseline: false
reviewed_by: ShiftStart technical review
last_tested: ''
tested_platforms: []
source_references: []
change_record: Original procedure retained and placed under content-governance controls.
quality_gate: passed
---
## Steps
1. Check power, display errors, paper and network cable. Print a device configuration page if available.

2. Test network reachability using the approved printer IP.

{% capture kb_command_1 %}
Test-Connection 192.0.2.25 -Count 2; Test-NetConnection 192.0.2.25 -Port 9100
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell" command=kb_command_1 %}

3. Open the queue, cancel failed jobs and make sure **Use Printer Offline** is not selected.

4. Restart the spooler with administrator approval.

{% capture kb_command_2 %}
Restart-Service Spooler
Get-Service Spooler
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell (Admin)" command=kb_command_2 %}

   <div class="expected"><strong>Expected result:</strong> Spooler status is Running and the queue begins processing.</div>

5. Confirm the Windows printer port matches the current printer IP or approved print server queue.

## Verification
Print a Windows test page and a one-page document from the affected application.
