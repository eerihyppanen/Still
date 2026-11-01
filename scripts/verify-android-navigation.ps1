param(
    [string]$Serial = 'emulator-5554',
    [string]$Adb = 'adb'
)

# This check temporarily changes an emulator's display settings and restores them.
# It opens and cancels an empty habit form; no habit data is created or deleted.
$ErrorActionPreference = 'Stop'
if ($Serial -notlike 'emulator-*') { throw 'Run this display recreation check on an emulator.' }
$taskDeviceFile = "/sdcard/still-navigation-qa-$([Guid]::NewGuid().ToString('N')).xml"

function Invoke-TaskAdb {
    $taskOutput = & $Adb -s $Serial @args
    if ($LASTEXITCODE -ne 0) { throw "ADB failed: $args" }
    return $taskOutput
}
function Get-TaskUi {
    $taskDump = (Invoke-TaskAdb shell uiautomator dump $taskDeviceFile 2>&1) -join "`n"
    if ($taskDump -notmatch 'dumped to:') { throw "UI dump failed: $taskDump" }
    return [xml]((Invoke-TaskAdb exec-out cat $taskDeviceFile) -join "`n")
}
function Find-TaskNode([string]$Label) {
    $taskDeadline = [DateTime]::UtcNow.AddSeconds(20)
    do {
        $taskUi = Get-TaskUi
        $taskNode = $taskUi.SelectNodes('//node') | Where-Object {
            $_.'content-desc' -eq $Label -or $_.text -eq $Label -or
            ($Label -eq 'New habit' -and $_.'content-desc' -like '*Create your first habit*')
        } | Select-Object -First 1
        if ($taskNode) { return $taskNode }
        # Large text can place the empty-state create action below the viewport.
        if ($Label -eq 'New habit') {
            $taskScroll = $taskUi.SelectNodes('//node') | Where-Object { $_.scrollable -eq 'true' } | Select-Object -Last 1
            if ($taskScroll -and $taskScroll.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
                $taskScrollX = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
                $taskScrollTop = [int]$Matches[2]
                $taskScrollHeight = [int]$Matches[4] - $taskScrollTop
                Invoke-TaskAdb shell input swipe $taskScrollX ($taskScrollTop + [int]($taskScrollHeight * 0.75)) $taskScrollX ($taskScrollTop + [int]($taskScrollHeight * 0.25)) 300 | Out-Null
            }
        }
        Start-Sleep -Milliseconds 300
    } while ([DateTime]::UtcNow -lt $taskDeadline)
    throw "Navigation failed: UI target '$Label' did not appear."
}
function Tap-TaskNode($Node) {
    if ($Node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { throw 'Target has no bounds.' }
    $taskX = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
    $taskY = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
    Invoke-TaskAdb shell input tap $taskX $taskY | Out-Null
}

$taskOriginalFont = ((Invoke-TaskAdb shell settings get system font_scale) -join '').Trim()
$taskOriginalSize = (Invoke-TaskAdb shell wm size) -join "`n"
$taskOverride = [regex]::Match($taskOriginalSize, 'Override size: (\d+x\d+)')
function Restore-TaskDisplay {
    if ($taskOverride.Success) {
        Invoke-TaskAdb shell wm size $taskOverride.Groups[1].Value | Out-Null
    } else {
        Invoke-TaskAdb shell wm size reset | Out-Null
    }
    if ($taskOriginalFont -eq 'null') {
        Invoke-TaskAdb shell settings delete system font_scale | Out-Null
    } else {
        Invoke-TaskAdb shell settings put system font_scale $taskOriginalFont | Out-Null
    }
}

try {
    Invoke-TaskAdb shell am force-stop com.still.habits | Out-Null
    Invoke-TaskAdb shell am start -n com.still.habits/.MainActivity | Out-Null
    $null = Find-TaskNode 'New habit'
    foreach ($taskCycle in 1..2) {
        Invoke-TaskAdb shell wm size 840x1860 | Out-Null
        Invoke-TaskAdb shell settings put system font_scale 1.5 | Out-Null
        $null = Find-TaskNode 'New habit'
        Restore-TaskDisplay
        Tap-TaskNode (Find-TaskNode 'New habit')
        $null = Find-TaskNode 'Habit name'
        Tap-TaskNode (Find-TaskNode 'Cancel')
        $null = Find-TaskNode 'New habit'
        Write-Output "PASS: display recreation cycle $taskCycle; form opens and cancels."
    }
} finally {
    Restore-TaskDisplay
    & $Adb -s $Serial shell rm -f $taskDeviceFile | Out-Null
}
