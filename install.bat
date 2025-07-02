@echo off
echo Family Privacy Extension - Installation Script
echo ==============================================
echo.

:: Check if Chrome is installed
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Google Chrome is not installed!
    echo Please install Chrome first from https://www.google.com/chrome/
    pause
    exit /b 1
)

echo ✓ Chrome detected
echo.

:: Create icons directory if it doesn't exist
if not exist "icons" (
    mkdir icons
    echo ✓ Created icons directory
)

:: Check if all required files exist
set "missing_files="
if not exist "manifest.json" set "missing_files=%missing_files% manifest.json"
if not exist "background.js" set "missing_files=%missing_files% background.js"
if not exist "content.js" set "missing_files=%missing_files% content.js"
if not exist "popup.html" set "missing_files=%missing_files% popup.html"

if not "%missing_files%"=="" (
    echo ERROR: Missing required files:%missing_files%
    echo Please ensure all files are in the correct location.
    pause
    exit /b 1
)

echo ✓ All required files found
echo.

echo Installation Instructions:
echo 1. Open Google Chrome
echo 2. Navigate to chrome://extensions/
echo 3. Enable "Developer mode" (toggle in top-right)
echo 4. Click "Load unpacked"
echo 5. Select this folder: %CD%
echo 6. The extension should now be loaded!
echo.
echo Current folder: %CD%
echo.
echo Press any key to open Chrome extensions page...
pause >nul

:: Open Chrome extensions page
start chrome://extensions/

echo.
echo Installation script completed!
echo.
echo Next steps:
echo - Follow the instructions above to load the extension
echo - Click the extension icon in Chrome toolbar
echo - Go to Settings to configure your first profile
echo.
echo For detailed setup instructions, see TUTORIAL.md
echo.
pause
