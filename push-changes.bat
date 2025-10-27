@echo off
echo Pushing changes to repository...
echo.

echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "major search feature 5:20  takes to surah hijr and ayat 20  while showing snippet of three words
hijr goes to surah hijr. shows a snippets
always show the surah ayat results first.
كَدَأْبِ make it diatriatics insensitive . arabic words are diatriatics insensitive.  
cave 44 goes to surah 18:44
"bee last" ,"

echo.
echo Pushing to remote repository...
git push

echo.
echo Done! Changes have been pushed to the repository.
pause