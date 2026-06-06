# GitHub Project Board — Iqraa Implementation Plan

The 20-week plan is tracked as **24 closed issues** (#1–#24) on [Alikhalil2r/iqraa22](https://github.com/Alikhalil2r/iqraa22).

Creating a GitHub Project requires the `project` and `read:project` OAuth scopes. If `gh auth status` does not list those scopes, run the one-time refresh below, then execute the commands in order.

## 1. Refresh GitHub CLI token (one-time, interactive)

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth refresh -h github.com -s project,read:project
```

Verify scopes:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth status
```

You should see `project` and `read:project` in the token scopes list.

## 2. Create the project board

```powershell
$repo = "Alikhalil2r/iqraa22"
$projectTitle = "Iqraa Implementation Plan"

# Create user-scoped project (works without org admin)
$projectUrl = & "C:\Program Files\GitHub CLI\gh.exe" project create --owner Alikhalil2r --title $projectTitle --format json --jq ".url"
Write-Host "Project created: $projectUrl"

# Resolve project number
$projectNumber = & "C:\Program Files\GitHub CLI\gh.exe" project list --owner Alikhalil2r --format json --jq ".projects[] | select(.title==`"$projectTitle`") | .number" | Select-Object -First 1
Write-Host "Project number: $projectNumber"
```

## 3. Add all 24 closed issues to the project

```powershell
$issues = 1..24
foreach ($n in $issues) {
  $issueId = & "C:\Program Files\GitHub CLI\gh.exe" issue view $n --repo $repo --json id --jq ".id"
  & "C:\Program Files\GitHub CLI\gh.exe" project item-add $projectNumber --owner Alikhalil2r --url "https://github.com/$repo/issues/$n"
  Write-Host "Added issue #$n"
}
```

## 4. Optional — add Status field columns

GitHub Projects v2 uses built-in **Status** (Todo / In Progress / Done). After adding items, open the project in the browser and bulk-set closed issues to **Done**:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" project view $projectNumber --owner Alikhalil2r --web
```

## Issue index (M1–M4)

| # | Milestone item |
|---|----------------|
| 1–4 | M1 Foundation (git, README, dev script, env, schema) |
| 5–6 | M1 DB + Prisma |
| 7–8 | M1 Docker + CI |
| 9 | M2 API tests |
| 10–12 | M2 Auth (RoleGuard, refresh, 2FA) |
| 13 | M2 Observability |
| 14 | M2 Payments POC |
| 15 | M2 E2E + UAT |
| 16 | M3 Student portal |
| 17–18 | M3 Email + SMS |
| 19–20 | M3 PDF + uploads |
| 21 | M3 Multi-tenant |
| 22 | M4 PWA |
| 23 | M4 Parent exams + exports |
| 24 | M4 GO-LIVE runbook |

All issues above are **closed** as of the final implementation commit on `main`.
