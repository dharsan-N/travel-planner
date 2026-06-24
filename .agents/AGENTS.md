# Agent Rules for Travel Planner Workspace

## Commit Command Rule
Whenever the user requests "make today commit" or similar:
1. Stage all current changes in the repository (`git add .`).
2. Commit the changes using the current date and time:
   `git commit -m "<message>"`
3. Push the changes to the remote repository:
   `git push origin main`

