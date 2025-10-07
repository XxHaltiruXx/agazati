@echo off
echo Telepítem a következő VS Code extensionöket:
echo dharmey.timer, Prettier, Live Server, Live Share, Synthwave 84', Auto Rename Tag, Material Icon Theme
echo.

:: Ellenőrizzük, hogy a code parancs elérhető-e
where code >nul 2>&1
if %errorlevel% neq 0 (
    echo Hiba: a 'code' parancs nincs telepítve vagy nincs PATH-ban.
    echo Nyisd meg a VS Code-ot, és futtasd a "Shell Command: Install 'code' command in PATH"-t.
    pause
    exit /b
)

:: Extensionök listája
for %%e in (
    dharmey.timer
    esbenp.prettier-vscode
    ritwickdey.liveserver
    ms-vsliveshare.vsliveshare
    robbowen.synthwave-vscode
    formulahendry.auto-rename-tag
    pkief.material-icon-theme
) do (
    echo Telepítés: %%e
    code --install-extension %%e >nul 2>&1
    if %errorlevel% neq 0 (
        echo Figyelem: Nem sikerült telepíteni %%e, folytatom a következővel.
    ) else (
        echo %%e telepítve.
    )
)

echo.
echo Minden extension feldolgozva!
pause
