param(
  [string]$Owner,
  [string]$RepoName = "Personal-CRM",
  [ValidateSet("private", "public")]
  [string]$Visibility = "private",
  [string]$Branch = "main",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message"
}

function Invoke-GitHub {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body = $null,
    [switch]$AllowNotFound
  )

  try {
    if ($null -eq $Body) {
      return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
    }

    return Invoke-RestMethod `
      -Method $Method `
      -Uri $Uri `
      -Headers $Headers `
      -ContentType "application/json" `
      -Body ($Body | ConvertTo-Json -Depth 8)
  }
  catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($AllowNotFound -and $statusCode -eq 404) {
      return $null
    }

    throw
  }
}

$repoRoot = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) {
  throw "Run this script from inside the Personal-CRM git repository."
}

Set-Location $repoRoot

$displayOwner = if ($Owner) { $Owner } else { "<authenticated-user>" }
if ($DryRun) {
  Write-Step "Dry run only"
  Write-Host "Repository: https://github.com/$displayOwner/${RepoName}"
  Write-Host "Branch: $Branch"
  Write-Host "Visibility: $Visibility"
  Write-Host "This script will create the repo if missing, set origin, rename the branch, and push."
  exit 0
}

$dirty = git status --porcelain
if ($dirty) {
  throw "The working tree has uncommitted changes. Commit or stash them before publishing."
}

$token = if ($env:GH_TOKEN) { $env:GH_TOKEN } else { $env:GITHUB_TOKEN }
if (-not $token) {
  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if ($gh) {
    $candidateToken = gh auth token 2>$null
    if ($LASTEXITCODE -eq 0 -and $candidateToken) {
      $token = $candidateToken.Trim()
    }
  }
}

if (-not $token) {
  throw "Set GH_TOKEN or GITHUB_TOKEN to a GitHub personal access token with repo/create-repo access, or authenticate GitHub CLI with gh auth login, then rerun this script."
}

$headers = @{
  Accept = "application/vnd.github+json"
  Authorization = "Bearer $token"
  "User-Agent" = "Personal-CRM-publish-script"
  "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Step "Checking GitHub identity"
$viewer = Invoke-GitHub -Method "GET" -Uri "https://api.github.com/user" -Headers $headers
$targetOwner = if ($Owner) { $Owner } else { $viewer.login }

Write-Step "Checking repository https://github.com/$targetOwner/${RepoName}"
$repo = Invoke-GitHub `
  -Method "GET" `
  -Uri "https://api.github.com/repos/$targetOwner/${RepoName}" `
  -Headers $headers `
  -AllowNotFound

if (-not $repo) {
  Write-Step "Creating $Visibility GitHub repository"
  $body = @{
    description = "Production-minded Personal CRM workspace with web, mobile, desktop, API, agents, and platform orchestration."
    has_issues = $true
    has_projects = $false
    has_wiki = $false
    name = $RepoName
    private = ($Visibility -eq "private")
  }

  $createUri = if ($targetOwner -eq $viewer.login) {
    "https://api.github.com/user/repos"
  } else {
    "https://api.github.com/orgs/$targetOwner/repos"
  }

  $repo = Invoke-GitHub -Method "POST" -Uri $createUri -Headers $headers -Body $body
}

$remoteUrl = "https://github.com/$targetOwner/${RepoName}.git"
$remotes = git remote
if ($remotes -contains "origin") {
  Write-Step "Updating origin remote"
  git remote set-url origin $remoteUrl
} else {
  Write-Step "Adding origin remote"
  git remote add origin $remoteUrl
}

Write-Step "Renaming current branch to $Branch"
git branch -M $Branch

Write-Step "Pushing to GitHub"
git -c "http.https://github.com/.extraheader=AUTHORIZATION: bearer $token" push -u origin $Branch

Write-Step "Published"
Write-Host $repo.html_url
