---
title: No network on docking station
slug: no-network-docking-station
description: Isolate dock Ethernet failures across cable, port, adapter, driver and firmware layers.
content_type: procedure
category: Network & Connectivity
severity: medium
tags:
- dock
- ethernet
- usb-c
- driver
error_codes:
- Unidentified network
- Network cable unplugged
tldr: Reseat power and USB-C, test a known-good cable/port, then reset the dock Ethernet adapter and update approved dock firmware.
related_symptoms:
- dock-no-network
related_causes:
- dock-adapter-state
next_steps: []
escalation: Escalate to Desktop Engineering with laptop and dock models, serials, cable/port tests, adapter status, driver version and whether another laptop works on the same dock.
last_reviewed: 2026-08-02
permalink: /procedures/no-network-docking-station/
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
1. Confirm Wi-Fi works, then test the Ethernet cable and wall port with a known-good device.

2. Power-cycle the dock: disconnect laptop, dock power and peripherals for 30 seconds, reconnect dock power, then USB-C.

3. Inspect adapter state and addressing.

{% capture kb_command_1 %}
Get-NetAdapter | Sort-Object Status,Name | Format-Table Name,InterfaceDescription,Status,LinkSpeed
Get-NetIPConfiguration
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell" command=kb_command_1 %}

   <div class="expected"><strong>Expected result:</strong> The dock Ethernet adapter is Up and has an approved IP, gateway and DNS configuration.</div>

4. Disable and enable only the identified dock adapter.

{% capture kb_command_2 %}
Disable-NetAdapter -Name 'Ethernet' -Confirm:$false
Start-Sleep 3
Enable-NetAdapter -Name 'Ethernet' -Confirm:$false
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell (Admin)" command=kb_command_2 %}

5. Install only approved laptop, dock and NIC driver/firmware updates.

## Verification
Disconnect Wi-Fi and confirm stable access to gateway, DNS and an internal resource over dock Ethernet.
