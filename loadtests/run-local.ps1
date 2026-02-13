#!/usr/bin/env pwsh
# =============================================================================
# Local Load Test Runner for Windows
# =============================================================================
# Usage: .\run-local.ps1 -TestId <test-id> -Profile <profile> [-Url <target-url>]
# Example: .\run-local.ps1 -TestId student-enrollment -Profile smoke -Url http://localhost:5000
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$TestId,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("smoke", "load", "stress", "chaos")]
    [string]$Profile = "smoke",
    
    [Parameter(Mandatory = $false)]
    [string]$Url = "http://localhost:5000"
)

$ErrorActionPreference = "Stop"

# Resolve paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $scriptDir "manifest.yaml"

# Check JMeter
$jmeterPath = $env:JMETER_HOME
if (-not $jmeterPath) {
    Write-Host "JMETER_HOME not set. Checking common locations..." -ForegroundColor Yellow
    $commonPaths = @(
        "C:\apache-jmeter\bin\jmeter.bat",
        "C:\jmeter\bin\jmeter.bat",
        "$env:USERPROFILE\apache-jmeter\bin\jmeter.bat"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $jmeterPath = Split-Path -Parent (Split-Path -Parent $path)
            break
        }
    }
}

if (-not $jmeterPath -or -not (Test-Path "$jmeterPath\bin\jmeter.bat")) {
    Write-Host "ERROR: JMeter not found. Please install JMeter and set JMETER_HOME" -ForegroundColor Red
    Write-Host "Download: https://jmeter.apache.org/download_jmeter.cgi" -ForegroundColor Cyan
    exit 1
}

# Parse manifest
if (-not (Test-Path $manifestPath)) {
    Write-Host "ERROR: manifest.yaml not found at $manifestPath" -ForegroundColor Red
    exit 1
}

# Simple YAML parsing for test and profile info
$manifest = Get-Content $manifestPath -Raw

# Find test configuration
$testPattern = "(?s)- id: $TestId.*?(?=\n  - id:|\n\n[a-zA-Z]|\z)"
$testMatch = [regex]::Match($manifest, $testPattern)
if (-not $testMatch.Success) {
    Write-Host "ERROR: Test '$TestId' not found in manifest" -ForegroundColor Red
    Write-Host "Available tests:" -ForegroundColor Yellow
    [regex]::Matches($manifest, "- id: ([^\s]+)") | ForEach-Object { 
        Write-Host "  - $($_.Groups[1].Value)" 
    }
    exit 1
}

# Extract JMX file
$jmxPattern = "jmx_file:\s*([^\s]+)"
$jmxMatch = [regex]::Match($testMatch.Value, $jmxPattern)
if (-not $jmxMatch.Success) {
    Write-Host "ERROR: jmx_file not defined for test '$TestId'" -ForegroundColor Red
    exit 1
}
$jmxFile = Join-Path $scriptDir $jmxMatch.Groups[1].Value

if (-not (Test-Path $jmxFile)) {
    Write-Host "ERROR: JMX file not found: $jmxFile" -ForegroundColor Red
    exit 1
}

# Get profile settings
$profilePattern = "(?s)$Profile`:\s*description:[^\n]*\s*concurrent_users:\s*(\d+)\s*duration_seconds:\s*(\d+)\s*ramp_up_seconds:\s*(\d+)"
$profileMatch = [regex]::Match($manifest, $profilePattern)
if (-not $profileMatch.Success) {
    Write-Host "ERROR: Profile '$Profile' not found" -ForegroundColor Red
    exit 1
}

$concurrentUsers = $profileMatch.Groups[1].Value
$durationSeconds = $profileMatch.Groups[2].Value
$rampUpSeconds = $profileMatch.Groups[3].Value

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Running Load Test Locally" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Test ID:      $TestId"
Write-Host "Profile:      $Profile"
Write-Host "JMX File:     $jmxFile"
Write-Host "Target URL:   $Url"
Write-Host "Users:        $concurrentUsers"
Write-Host "Duration:     $durationSeconds seconds"
Write-Host "Ramp-up:      $rampUpSeconds seconds"
Write-Host "=============================================" -ForegroundColor Cyan

# Create results directory
$resultsDir = Join-Path $scriptDir "results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resultFile = Join-Path $resultsDir "$TestId-$Profile-$timestamp.jtl"
$reportDir = Join-Path $resultsDir "$TestId-$Profile-$timestamp-report"

# Run JMeter
$jmeterCmd = "$jmeterPath\bin\jmeter.bat"
$jmeterArgs = @(
    "-n",
    "-t", $jmxFile,
    "-Jwebapp_url=$Url",
    "-Jconcurrent_users=$concurrentUsers",
    "-Jduration_seconds=$durationSeconds",
    "-Jramp_up_seconds=$rampUpSeconds",
    "-l", $resultFile,
    "-e", "-o", $reportDir
)

Write-Host "`nStarting JMeter..." -ForegroundColor Green
& $jmeterCmd $jmeterArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=============================================" -ForegroundColor Green
    Write-Host "Test completed successfully!" -ForegroundColor Green
    Write-Host "Results: $resultFile" -ForegroundColor Cyan
    Write-Host "Report:  $reportDir\index.html" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Green
    
    # Open report in browser
    $openReport = Read-Host "Open HTML report in browser? (y/n)"
    if ($openReport -eq "y") {
        Start-Process "$reportDir\index.html"
    }
}
else {
    Write-Host "`nTest failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
