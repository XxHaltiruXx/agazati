$extensions = @(
    "ms-vsliveshare.vsliveshare",
    "prasadbobby.auto-rename-tag",
    "ritwickdey.liveserver",
    "robbowen.synthwave-vscode"
)

foreach ($ext in $extensions) {
    Write-Host "Installing extension: $ext"
    code --install-extension $ext --force
}

Write-Host "All extensions installed."
pause
