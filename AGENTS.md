# AGENTS.md — TUTUR AI Coding Agent Rules

Read `docs/TUTUR_DEVELOPER_PACK.md` before coding.

## Mission

Build a working six-hour hackathon MVP for TUTUR, a language-data micro-bounty app on Monad Testnet.

The required demo flow is:

1. Sponsor creates and funds a task with native MON.
2. Contributor submits a text contribution hash and explicitly acknowledges the task usage terms.
3. Three configured validators can vote once each.
4. Two approvals pay the contributor and an 8% platform fee to treasury.
5. Two rejections or unresolved expiry refund the sponsor.

## Rules

- Inspect the repository before editing. Preserve working code and dependencies.
- Implement P0 requirements first; do not add tokens, DAO, NFTs, audio capture, or unrelated features.
- Do not fake blockchain transactions, addresses, analytics, or success states.
- Never ask for, print, or commit private keys or seed phrases. Human operators sign deployments using a burner wallet.
- Raw contribution text must stay off-chain. Only submit a content hash on-chain.
- Do not invent customer demand, revenue, TPS figures, or legal compliance claims.
- Show loading, pending, confirmed, and error states. Wait for transaction receipts before reporting success.
- Keep the app buildable after each substantial change.
- Prefer local storage for MVP metadata; add Supabase only if the full on-chain flow already works.
- Use the testnet settings and contract behavior in the developer pack; confirm with organizers if their instructions change.

## Execution order

1. Inspect files and report the current state briefly.
2. Implement Solidity contracts and tests.
3. Build frontend pages and wallet connection.
4. Integrate create → submit → vote → payout/refund.
5. Run contract tests, lint/typecheck/build checks.
6. Document human-operated deployment and hosting.
7. Update README with real addresses and transaction hashes only after deployment.

## Definition of done

- Contract compile and critical tests pass.
- Real Monad Testnet wallet transactions are supported.
- UI reflects on-chain state and links to real explorer transactions.
- No secrets are committed.
- README and `.env.example` exist.
- The human operator has clear deployment steps.
