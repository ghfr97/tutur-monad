# AGENTS.md — Instructions for AI Coding Agents

You are building **TUTUR**, a six-hour Monad Blitz MVP. Read `TUTUR_DEVELOPER_PACK.md` before coding. Follow this file as the operating rules for the repository.

## Mission
Ship one complete, demonstrable flow:

1. A sponsor creates a language-data bounty and funds it with native testnet MON.
2. A contributor submits a text contribution and confirms the data-use terms.
3. Three configured validators vote independently; two matching votes decide the result.
4. On approval, the contributor receives the reward and the platform treasury receives an 8% service fee. On rejection or expiry, the sponsor receives a refund.
5. The live web app shows the contract address and real transaction links.

## Work rules

- Inspect the existing repository before changing files. Preserve working code and configuration. If the repository already has a stack, do not replace it without a concrete reason.
- Read the product spec and follow its P0 scope. Do not add tokenomics, DAO governance, voice recording, mobile apps, complex indexing, or unrelated features before the end-to-end MVP works.
- Implement incrementally. Keep the app runnable after each substantial change.
- Prefer a small, understandable implementation over abstractions or dependencies that do not help the demo.
- Do not fake blockchain success. A mock/demo mode must be clearly labelled and must never be presented as a confirmed on-chain transaction.
- Never request, print, commit, paste into a prompt, or otherwise expose private keys or seed phrases. Do not create a deployment script that embeds a private key. The human operator creates a burner wallet and signs deployment/transactions themselves.
- Public chain configuration and deployed contract addresses may be stored in `.env.local`; secrets must not be committed. Commit only `.env.example` with placeholders/public settings.
- Do not send raw private information, personal data, or voice recordings to the blockchain. The hackathon MVP is text-first and should use sample/non-sensitive language examples.
- Do not claim that TUTUR's data licensing, quality checks, or market demand are legally or commercially validated. Present them as product hypotheses.
- Do not invent TPS figures, transaction receipts, users, customer commitments, or revenue. Show measured results only.
- Add loading, success, and error states for wallet and transaction actions. Show the explorer link only when a real transaction hash exists.
- Make the visual design deliberate: compact, calm, editorial, language/data-oriented. Avoid generic gradient-heavy Web3 dashboards and fabricated analytics.

## Required order of execution

1. Inspect files, available scripts, and existing dependencies.
2. Summarize the current repository state in a few lines, then proceed without waiting for approval.
3. Build the smart contracts and tests first enough to lock the interface.
4. Build the frontend against that interface. Use sample metadata for UI development while contracts are being built.
5. Run contract tests, frontend lint/typecheck/build, and fix critical failures.
6. Document the human-operated testnet deployment and hosting steps in README.
7. Stop adding features when the create → submit → vote → payout/refund path works. Use remaining time for contract verification, deployment, README, and demo rehearsal.

## Definition of done

- The factory and escrow contracts compile; tests cover happy path, unauthorized voting, double voting, duplicate submission, wrong payment, rejection/refund, expiry, and fee calculation.
- The frontend can connect a wallet on Monad Testnet, create a task, submit a contribution hash, vote as a validator, and render the resulting on-chain state.
- The UI's text metadata can be stored off-chain. If Supabase is not configured, the application must still work for a same-browser demo using local storage and clearly handle missing metadata on another browser.
- No transaction is marked successful until its receipt is confirmed.
- `.env.example`, a usable README, public deployment instructions, contract address placeholders, and a three-minute demo checklist exist.
- The site is buildable and hostable. Testnet deployment and web hosting are performed by the human operator, not by exposing keys to the coding agent.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
