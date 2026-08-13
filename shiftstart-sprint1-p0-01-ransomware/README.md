# ShiftStart Verification Sprint 1 — P0-01

Procedure: `respond-to-a-ransomware-alert`

This package performs the authoritative-source review and corrects unsafe/generic ransomware guidance. It does **not** claim live verification.

Apply from the ShiftStart repo root:

```bash
git status
git fetch origin
git pull --rebase origin main

unzip -q shiftstart-sprint1-p0-01-ransomware.zip
python3 shiftstart-sprint1-p0-01-ransomware/apply-sprint1-p0-01.py
```

Then:

```bash
npm run verification:v2:apply
npm run verification:evidence:check
npm run check
npm run build
```

Review:

```bash
cat verification/sprint-1/respond-to-a-ransomware-alert-source-review.yml
cat docs/verification/SPRINT1-P0-01-RANSOMWARE-TEST-PLAN.md
cat verification/evidence/pending/respond-to-a-ransomware-alert.yml
```

Do not change `status` to `completed` until the three environment records and two SME reviewers are real and recorded.

After actual tests:

```bash
npm run verification:evidence:check

npm run verification:evidence:apply -- \
  --slug respond-to-a-ransomware-alert

npm run verification:evidence:apply -- \
  --slug respond-to-a-ransomware-alert \
  --apply

npm run verification:v2:apply
npm run readiness:promote
npm run check
```
