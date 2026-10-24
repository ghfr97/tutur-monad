# Prompt for Claude Code

Open this folder as the project root in Claude Code. Paste the prompt below. Keep `AGENTS.md` and `docs/TUTUR_DEVELOPER_PACK.md` in the repository.

---

You are a senior full-stack Web3 engineer and product designer. Build TUTUR, a working Monad Blitz hackathon MVP, not a static mockup.

First read `AGENTS.md` and `docs/TUTUR_DEVELOPER_PACK.md` completely. Inspect the repository and preserve any working code. Then implement the P0 acceptance checklist in the developer pack. Do not stop after giving a plan; proceed with coding.

## Goal

Implement this complete workflow:

1. Sponsor creates a language-data task and funds an independent escrow with native MON.
2. Contributor submits a text contribution hash and explicitly acknowledges usage terms.
3. Three configured validators can each vote once.
4. Two approvals pay the contributor reward and an 8% fee to treasury.
5. Two rejections or unresolved expiry refund the sponsor.
6. Frontend displays actual on-chain state and real explorer links.

## Technical defaults

- Solidity + Foundry for contracts and tests.
- Next.js + TypeScript + Tailwind CSS for frontend.
- viem for wallet and contract interactions.
- Monad Testnet chain ID 10143, RPC `https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadexplorer.com`, subject to organizer updates.
- Local storage for baseline task metadata; Supabase is optional only after the on-chain workflow works.

## Execution requirements

1. Implement the factory and task escrow contracts with the state transitions and safeguards in the developer pack.
2. Add Foundry tests for incorrect payment, invalid configuration, unauthorized/double voting, duplicate submissions, missing consent, approval payout, rejection refund, expiry refund, and failed transfers.
3. Build the required pages and responsive UI.
4. Integrate real wallet transactions and wait for receipts before showing success.
5. Keep raw contribution text off-chain; submit only the content hash.
6. Run contract tests and frontend lint/typecheck/build where available; fix critical failures.
7. Update README and `.env.example`.
8. Provide clear human-operated deployment steps. Never ask for, print, or commit a private key or seed phrase.

## Time-box

Finish P0 first. Do not build custom tokens, DAO, NFTs, audio capture, mobile apps, AI adjudication, or complex indexing. If time is short, remove optional analytics and Supabase before sacrificing the working payout flow, tests, README, or deployability.

Do not fake transaction success, addresses, metrics, users, customer commitments, or revenue. Do not claim the contracts are audited or that only Monad can support the architecture.

## Final report

At the end, summarize:
- Files created/changed.
- What actually works.
- Contract test results.
- Frontend build results.
- Known bugs and incomplete features.
- Exact steps a human must perform to deploy to Monad Testnet and host the app.

Make reasonable decisions without asking me about minor details. Start by inspecting the repository, then implement the MVP.
