$ErrorActionPreference = "Continue"

function Get-VidPid {
    param([string]$DeviceId)
    $vendorId = $null
    $productId = $null
    if ($DeviceId -match 'VID_([0-9A-Fa-f]{4})') { $vendorId = $Matches[1].ToUpper() }
    if ($DeviceId -match 'PID_([0-9A-Fa-f]{4})') { $productId = $Matches[1].ToUpper() }
    [pscustomobject]@{ VID = $vendorId; PID = $productId }
}

Write-Host "=== SERIAL PORTS ==="
Get-CimInstance Win32_SerialPort | ForEach-Object {
    $ids = Get-VidPid $_.PNPDeviceID
    [pscustomobject]@{
        "Device Name" = $_.Description
        "COM Port" = $_.DeviceID
        "PNPDeviceID" = $_.PNPDeviceID
        "VID" = $ids.VID
        "PID" = $ids.PID
    }
} | Format-Table -AutoSize

Write-Host ""
Write-Host "=== USB / HID CANDIDATES ==="
Get-CimInstance Win32_PnPEntity |
    Where-Object { $_.PNPDeviceID -match 'VID_' -and ($_.PNPClass -match 'USB|HIDClass|Ports' -or $_.Name -match 'USB|HID|Relay|Serial|COM') } |
    ForEach-Object {
        $ids = Get-VidPid $_.PNPDeviceID
        [pscustomobject]@{
            "Device Name" = $_.Name
            "Device Class" = $_.PNPClass
            "Manufacturer" = $_.Manufacturer
            "VID" = $ids.VID
            "PID" = $ids.PID
            "PNPDeviceID" = $_.PNPDeviceID
        }
    } | Sort-Object "Device Name", "PNPDeviceID" | Format-Table -AutoSize -Wrap
