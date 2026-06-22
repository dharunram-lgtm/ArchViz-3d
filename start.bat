@echo off
cd /d "%~dp0"

if /i "%1"=="prod" goto prod
if /i "%1"=="production" goto prod

:dev
echo == Development Mode ==
if not exist "node_modules" npm install
if not exist "server\node_modules" cd server && npm install && cd ..
if not exist "client\node_modules" cd client && npm install && cd ..
npm run dev
exit /b

:prod
echo == Production Mode ==
if not exist "node_modules" npm install
if not exist "server\node_modules" cd server && npm install && cd ..
if not exist "client\node_modules" cd client && npm install && cd ..
npm start
exit /b