@echo off
cd /d "%~dp0.."
npm.cmd run start -- --localhost > expo-start.log 2> expo-start.err.log
