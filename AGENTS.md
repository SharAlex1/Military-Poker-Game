# Instructions for future Codex sessions

1. Read README.md, GAME_DESIGN.md, ARCHITECTURE.md and ROADMAP.md before modifying the project. Inspect Git status and preserve the user's existing changes.
2. Work in the existing checkout. Cloud tasks already use isolated environments; do not create worktrees unless explicitly requested.
3. Preserve working features, accessible UI, fictional-chip restrictions and module boundaries. Do not silently remove behavior or expand the requested milestone.
4. Keep poker rules and transitions independent of React and platform APIs. AI must never see other players' private cards. Do not present placeholder profiles as implemented strategies.
5. Use the lockfile and `npm ci` for reproducible installation. Never commit secrets, node_modules, generated builds or test coverage.
6. Add meaningful tests for changed rules, state or behavior. Run `npm run check` before finishing code changes and investigate failures; report unrun or failing checks honestly.
7. Update ROADMAP.md when scope, milestone completion or known limitations change. Keep the other documentation consistent with actual behavior.
8. Use original or appropriately licensed assets and record provenance. Keep real-money gambling, backend services and databases outside this project's scope.
9. Keep platform integration behind adapters so a Windows package can be added later. Do not claim Windows packaging or compatibility has been validated without the corresponding checks.
