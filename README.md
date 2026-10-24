# TUTUR — Local Starter Pack

This folder organizes the product brief and instructions needed to build the TUTUR Monad hackathon MVP with Claude Code or another AI coding agent.

## Start here

1. Read `AGENTS.md`.
2. Read `docs/TUTUR_DEVELOPER_PACK.md`.
3. Open this folder as the project root in Claude Code.
4. Paste the prompt from `PROMPT_CLAUDE.md`.
5. Let the agent implement the app, then review tests and deployment steps.

## Folder map

```text
TUTUR_LOCAL_STARTER/
├── AGENTS.md
├── PROMPT_CLAUDE.md
├── README.md
├── .env.example
├── docs/
│   ├── TUTUR_DEVELOPER_PACK.md
│   └── README_TEMPLATE.md
├── app/                 # Frontend app code goes here
├── lib/                 # Shared frontend utilities
└── contracts/
    ├── src/             # Solidity contracts
    └── test/            # Foundry tests
```

The `app/`, `lib/`, and `contracts/` directories are scaffolding locations, not a finished application. Ask the coding agent to inspect the repository and scaffold the chosen framework.

## Important

- Never place private keys or seed phrases in this folder or share them with an AI agent.
- `.env.example` contains public configuration placeholders only.
- Do not claim a contract is deployed until a human has deployed it and confirmed its address.
- The product is a hackathon prototype, not audited production software.
