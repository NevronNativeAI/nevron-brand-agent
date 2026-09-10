<#
.SYNOPSIS
  Remove the hand-installed nevron-brand agent and skills after switching to the plugin.

.DESCRIPTION
  Before the plugin, this repo was installed by copying or junctioning files into
  ~/.claude/. Those copies stay active alongside the plugin, so you end up with the
  same skill registered twice - once bare ("datasheet") and once namespaced
  ("nevron-brand:datasheet"). The junctions are worse: they point into a clone whose
  skills/ folder the plugin conversion moved, so they dangle.

  This removes ONLY the four brand items below. The nevron.co website skills
  (nevron-copy, nevron-post, nevron-publish, nevron-seo) and the nevron-site agent
  are separate and are never touched.

  Dry run by default. Nothing is removed until you pass -Apply.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\migrate-from-hand-install.ps1
  powershell -ExecutionPolicy Bypass -File scripts\migrate-from-hand-install.ps1 -Apply
#>
[CmdletBinding()]
param(
  [switch]$Apply,
  [string]$ClaudeHome = (Join-Path $env:USERPROFILE '.claude')
)

$ErrorActionPreference = 'Stop'

$targets = @(
  @{ Path = Join-Path $ClaudeHome 'agents\nevron-brand.md';              What = 'brand agent' }
  @{ Path = Join-Path $ClaudeHome 'skills\nevron-document';              What = 'document skill' }
  @{ Path = Join-Path $ClaudeHome 'skills\nevron-document-nocover';      What = 'short document skill' }
  @{ Path = Join-Path $ClaudeHome 'skills\datasheet';                    What = 'datasheet skill' }
)

Write-Host ''
Write-Host 'Legacy hand-install cleanup' -ForegroundColor Cyan
Write-Host ("Looking in {0}" -f $ClaudeHome)
Write-Host ''

$found = @()
foreach ($t in $targets) {
  if (-not (Test-Path -LiteralPath $t.Path)) {
    Write-Host ("  absent   {0}" -f $t.Path) -ForegroundColor DarkGray
    continue
  }
  $item = Get-Item -LiteralPath $t.Path -Force
  # A junction or symlink is safe to drop outright; a real folder may hold local edits.
  $isLink = [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
  $kind = if ($isLink) { 'link' } elseif ($item.PSIsContainer) { 'folder' } else { 'file' }
  $found += [pscustomobject]@{ Path = $t.Path; What = $t.What; Kind = $kind; IsLink = $isLink }
  Write-Host ("  found    {0}  [{1}]  {2}" -f $t.Path, $kind, $t.What) -ForegroundColor Yellow
  if ($isLink) { Write-Host ("           -> {0}" -f $item.Target) -ForegroundColor DarkGray }
}

Write-Host ''
if ($found.Count -eq 0) {
  Write-Host 'Nothing to clean up - the plugin is your only install.' -ForegroundColor Green
  return
}

# Real folders and files may carry local edits worth keeping, so they are backed up.
$backup = Join-Path $ClaudeHome ('backup-hand-install-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))

if (-not $Apply) {
  Write-Host ("{0} item(s) would be removed." -f $found.Count) -ForegroundColor Cyan
  Write-Host ("Non-link items would be copied to {0} first." -f $backup)
  Write-Host ''
  Write-Host 'Re-run with -Apply to do it.' -ForegroundColor Cyan
  return
}

foreach ($f in $found) {
  if (-not $f.IsLink) {
    if (-not (Test-Path -LiteralPath $backup)) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }
    Copy-Item -LiteralPath $f.Path -Destination $backup -Recurse -Force
    Write-Host ("  backed up  {0}" -f (Split-Path $f.Path -Leaf)) -ForegroundColor DarkGray
  }
  # Remove-Item on a junction deletes the link, not the target - but only when the
  # target is gone or -Recurse is withheld, so delete links via the directory API.
  if ($f.IsLink -and (Get-Item -LiteralPath $f.Path -Force).PSIsContainer) {
    [System.IO.Directory]::Delete($f.Path, $false)
  } else {
    Remove-Item -LiteralPath $f.Path -Recurse -Force -Confirm:$false
  }
  Write-Host ("  removed    {0}  ({1})" -f $f.Path, $f.What) -ForegroundColor Green
}

Write-Host ''
if (Test-Path -LiteralPath $backup) { Write-Host ("Backup: {0}" -f $backup) }
Write-Host 'Done. Restart Claude Code so the registry refreshes.' -ForegroundColor Green
