---
title: Outlook crashes or will not open
slug: outlook-crashes
description: Isolate add-in, profile, navigation pane and Office installation failures.
content_type: procedure
category: Microsoft 365 & Collaboration
severity: medium
tags:
- outlook
- office
- add-ins
- profile
error_codes:
- Cannot start Microsoft Outlook
- Outlook has stopped working
tldr: Open Outlook in safe mode; if it works, disable add-ins. Otherwise reset the navigation pane and test a new mail profile.
related_symptoms:
- outlook-wont-open
related_causes:
- outlook-addin
next_steps: []
escalation: Escalate to the Microsoft 365 team with Office build, crash time, Windows Event Viewer application error, add-in list, safe-mode result and profile test result.
last_reviewed: 2026-08-02
permalink: /procedures/outlook-crashes/
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
1. End remaining Outlook processes and start safe mode.

{% capture kb_command_1 %}
taskkill /F /IM outlook.exe
outlook.exe /safe
{% endcapture %}
{% include command.html shell="cmd" label="Command Prompt" command=kb_command_1 %}

   <div class="expected"><strong>Expected result:</strong> Outlook opens without optional add-ins. If so, disable add-ins one at a time.</div>

2. Reset the navigation pane.

{% capture kb_command_2 %}
outlook.exe /resetnavpane
{% endcapture %}
{% include command.html shell="cmd" label="Command Prompt" command=kb_command_2 %}

3. Check for Office and Windows updates, then run Quick Repair from Installed Apps.

4. Create a temporary new mail profile from Control Panel > Mail. Do not delete the old profile until the new one is verified.

   <div class="expected"><strong>Expected result:</strong> A clean profile opens and synchronises the mailbox.</div>

## Verification
Open Outlook normally twice, send a test message and confirm search and calendar load correctly.
