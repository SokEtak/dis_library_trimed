@echo off

:: Open VS Code in project
start "" code "C:\Users\Vanntak\Herd\library_dis"

:: Open Windows Terminal with correct working directory
start "" wt -w -1 ^
new-tab --title "VITE DEV" -d "C:\Users\Vanntak\Herd\library_dis" cmd /k "npm run dev" ^
; new-tab --title "REVERB" -d "C:\Users\Vanntak\Herd\library_dis" cmd /k "php artisan reverb:start" ^
; new-tab --title "LARAVEL SERVE" -d "C:\Users\Vanntak\Herd\library_dis" cmd /k "php artisan serve --port=8001"