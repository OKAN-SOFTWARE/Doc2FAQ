@echo off
setlocal
cd /d "%~dp0"
title Doc2FAQ v0.5.0

echo ====================================================
echo   Doc2FAQ v0.5.0 - Local Java application
echo ====================================================
echo.
echo This window runs your local Doc2FAQ server.
echo Once it starts, open: http://localhost:8080
echo Keep this window open while using the application.
echo.

if not exist "doc2faq-0.5.0.jar" (
  echo ERROR: The JAR is missing. Extract the entire ZIP first.
  goto :failed
)

where java >nul 2>&1
if errorlevel 1 (
  echo ERROR: Java was not found.
  echo Install Java 21 or later and confirm "java -version" works.
  goto :failed
)

java -version
echo.
java -jar "doc2faq-0.5.0.jar"
if errorlevel 1 goto :failed
echo.
echo Doc2FAQ has stopped.
pause
exit /b 0

:failed
echo.
echo Startup did not complete. See WINDOWS-QUICK-START.md.
pause
exit /b 1
