param(
    [string]$Serial = 'emulator-5554',
    [string]$Adb = 'adb'
)

# Open Still's habit form and focus a text field before running this check.
# The primary action must stay visible above the keyboard as well.
$ErrorActionPreference = 'Stop'
$taskDeviceFile = "/sdcard/still-keyboard-qa-$([Guid]::NewGuid().ToString('N')).xml"
try {
    $taskDump = (& $Adb -s $Serial shell uiautomator dump $taskDeviceFile 2>&1) -join "`n"
    if ($LASTEXITCODE -ne 0 -or $taskDump -notmatch 'dumped to:') {
        throw "Could not inspect the current Android UI: $taskDump"
    }
    [xml]$taskUi = (& $Adb -s $Serial exec-out cat $taskDeviceFile) -join "`n"
} finally {
    & $Adb -s $Serial shell rm -f $taskDeviceFile | Out-Null
}

$taskNodes = @($taskUi.SelectNodes('//node'))
if (!($taskNodes | Where-Object { $_.text -in 'New habit', 'Edit habit', 'A new beginning', 'Edit your habit' })) {
    throw 'Open the Still habit form before running this check.'
}
$taskDisplays = (& $Adb -s $Serial shell dumpsys window displays) -join "`n"
$taskIme = [regex]::Match($taskDisplays, 'type=ime frame=\[\d+,(\d+)\]\[\d+,\d+\][^\r\n]* visible=true')
if (!$taskIme.Success) {
    throw 'Show the Android keyboard by focusing a habit text field first.'
}
$taskKeyboardTop = [int]$taskIme.Groups[1].Value
$taskInput = $taskNodes | Where-Object { $_.class -eq 'android.widget.EditText' -and $_.focused -eq 'true' } | Select-Object -First 1
if (!$taskInput) {
    throw 'Focus a habit text field before running this check.'
}
# The development client also has a full-screen scroll view. Measure the form's own ancestor.
$taskScroll = $taskInput.ParentNode
while ($taskScroll -and $taskScroll.class -ne 'android.widget.ScrollView') {
    $taskScroll = $taskScroll.ParentNode
}
if (!$taskScroll -or $taskScroll.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    throw 'The habit form scroll viewport could not be measured.'
}
$taskViewportTop = [int]$Matches[2]
$taskViewportBottom = [int]$Matches[4]
if ($taskViewportBottom -gt ($taskKeyboardTop + 1)) {
    throw "Keyboard overlaps the form: viewport bottom $taskViewportBottom px, keyboard top $taskKeyboardTop px."
}
if (!$taskInput -or $taskInput.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    throw 'Focus a habit text field before running this check.'
}
$taskInputTop = [int]$Matches[2]
$taskInputBottom = [int]$Matches[4]
if ($taskInputTop -lt $taskViewportTop -or $taskInputBottom -le $taskInputTop -or $taskInputBottom -gt ($taskViewportBottom + 1)) {
    throw 'The focused text field is hidden outside the visible form.'
}

$taskPrimary = $taskNodes | Where-Object { $_.'content-desc' -in @('Create habit', 'Save changes') } | Select-Object -First 1
if (!$taskPrimary -or $taskPrimary.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    throw 'The fixed Create/Save action is not visible in the form.'
}
if ([int]$Matches[2] -lt 0 -or [int]$Matches[4] -le [int]$Matches[2] -or [int]$Matches[4] -gt ($taskKeyboardTop + 1)) {
    throw 'The keyboard obscures the fixed Create/Save action.'
}
Write-Output "PASS: form ends at $taskViewportBottom px above keyboard at $taskKeyboardTop px; focused field is visible."
