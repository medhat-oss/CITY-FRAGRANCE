@echo off
cd /d "D:\city-fragrance-next"
call npx opennextjs-cloudflare build -c wrangler.jsonc
exit /b %errorlevel%
