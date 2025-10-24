@echo off
echo Pushing changes to repository...
echo.

echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "UI: Remove home button and Admin text from navigation"

echo.
echo Pushing to remote repository...
git push

echo.
echo Done! Changes have been pushed to the repository.
pause