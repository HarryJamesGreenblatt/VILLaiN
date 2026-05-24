#!/usr/bin/env pwsh
# VILLaiN — game launcher
# Renders the title screen, handles New Game / Continue, launches Copilot CLI.

param(
    [string]$Agent = "FaiR",
    [string]$SaveDir = "$env:USERPROFILE\Documents\VILLaiN\.save"
)

$ErrorActionPreference = "Stop"

# ── Title art (georgia11, pre-baked) ────────────────────────────────────

$title = @"

                                                       ,,               
``7MMF'   ``7MF'``7MMF'``7MMF'      ``7MMF'                 db  ``7MN.   ``7MF'
  ``MA     ,V    MM    MM          MM                         MMN.    M  
   VM:   ,V     MM    MM          MM         ,6"Yb.  ``7MM    M YMb   M  
    MM.  M'     MM    MM          MM        8)   MM    MM    M  ``MN. M  
    ``MM A'      MM    MM      ,   MM      ,  ,pm9MM    MM    M   ``MM.M  
     :MM;       MM    MM     ,M   MM     ,M 8M   MM    MM    M     YMM  
      VF      .JMML..JMMmmmmMMM .JMMmmmmMMM ``Moo9^Yo..JMML..JML.    YM  

"@

# ── Render ──────────────────────────────────────────────────────────────

Clear-Host
Write-Host ""
Write-Host $title -ForegroundColor DarkYellow
Write-Host "  A narrative AI puzzle game" -ForegroundColor DarkGray
Write-Host "  localhost:5757" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray

# ── Menu ────────────────────────────────────────────────────────────────

$saveFile = Join-Path $SaveDir "state.json"
$hasSave = Test-Path $saveFile

if ($hasSave) {
    Write-Host ""
    $menu = @("&Continue", "&New Game", "&Quit")
    $choice = $Host.UI.PromptForChoice("", "  Select an option:", $menu, 0)

    switch ($choice) {
        0 {
            Write-Host "`n  Resuming session..." -ForegroundColor DarkYellow
        }
        1 {
            Write-Host "`n  Starting new game..." -ForegroundColor DarkYellow
            Remove-Item $saveFile -Force -ErrorAction SilentlyContinue
            # Full server reset — wipes state and resets browser.
            try { Invoke-RestMethod -Uri "http://127.0.0.1:5757/reset" -Method POST -ErrorAction SilentlyContinue | Out-Null } catch {}
        }
        2 {
            Write-Host "`n  Goodbye.`n" -ForegroundColor DarkGray
            return
        }
    }
} else {
    Write-Host ""
    $menu = @("&New Game", "&Quit")
    $choice = $Host.UI.PromptForChoice("", "  Select an option:", $menu, 0)

    switch ($choice) {
        0 {
            Write-Host "`n  Initializing..." -ForegroundColor DarkYellow
            # Full server reset — clean start.
            try { Invoke-RestMethod -Uri "http://127.0.0.1:5757/reset" -Method POST -ErrorAction SilentlyContinue | Out-Null } catch {}
        }
        1 {
            Write-Host "`n  Goodbye.`n" -ForegroundColor DarkGray
            return
        }
    }
}

# ── Ensure save directory exists ────────────────────────────────────────

if (-not (Test-Path $SaveDir)) {
    New-Item -ItemType Directory -Path $SaveDir -Force | Out-Null
}

# ── Ensure server is running ────────────────────────────────────────────

$serverRunning = $false
try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:5757/" -Method HEAD -TimeoutSec 2 -ErrorAction Stop
    $serverRunning = $true
} catch {
    $serverRunning = $false
}

if (-not $serverRunning) {
    Write-Host "  Starting VILLaiN server..." -ForegroundColor DarkGray
    $serverScript = Join-Path $PSScriptRoot "src" "server.mjs"
    Start-Process -FilePath "node" -ArgumentList $serverScript -WindowStyle Hidden -WorkingDirectory $PSScriptRoot
    # Wait for server to be ready.
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $null = Invoke-RestMethod -Uri "http://127.0.0.1:5757/" -Method HEAD -TimeoutSec 1 -ErrorAction Stop
            break
        } catch {}
    }
}

# Open the browser surface.
Start-Process "http://127.0.0.1:5757/"

# ── Launch ──────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  HITL beacon transmitting..." -ForegroundColor DarkYellow
Write-Host "  Awaiting consciousness on 127.0.0.1:5757" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Seconds 1

copilot --agent=$Agent
