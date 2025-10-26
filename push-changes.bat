@echo off
echo Pushing changes to repository...
echo.

echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "part2 osama codex"

echo.
echo Pushing to remote repository...
git push

echo.
echo Done! Changes have been pushed to the repository.
pause