# TUTUR

**Verifiable micro-bounties for local-language data.** Sponsors fund a task, contributors submit language examples, validators review the result, and accepted contributions are paid through a smart contract on Monad.

> Hackathon prototype for Monad Blitz Jogja. Uses Monad Testnet; testnet MON is not real-money revenue. Not production-ready.

## Links

- Live app: `REPLACE_WITH_PUBLIC_URL`
- GitHub repository: `REPLACE_WITH_PUBLIC_REPO_URL`
- Monad Testnet factory contract: `REPLACE_WITH_FACTORY_ADDRESS`
- Explorer: `https://testnet.monadexplorer.com/address/REPLACE_WITH_FACTORY_ADDRESS`
- Demo transaction: `REPLACE_WITH_REAL_TRANSACTION_HASH`
- Demo video: `REPLACE_WITH_VIDEO_URL`

Do not submit with placeholder values. Use only addresses and transaction hashes that actually exist.

## What it does

1. A sponsor funds a data task with native MON.
2. A contributor submits a text contribution and acknowledges the task usage terms.
3. Three configured validators review the contribution; two matching votes decide acceptance or rejection.
4. On acceptance, the contributor receives the reward and the treasury receives an 8% service fee.
5. On rejection or unresolved expiry, the sponsor receives a refund.

Raw contribution text is kept off-chain. The contract records a content hash and payment/verification state. The MVP is text-only and should use non-sensitive example data.

## Why Monad

Each data task receives its own escrow contract. Transactions involving independent tasks do not need to update one shared payout queue. This is an architectural fit for exploring Monad's optimistic parallel execution; it is not a claim that all transactions are guaranteed to run in parallel or that only Monad can support the pattern.

## Revenue model

TUTUR's initial business hypothesis is an 8% service fee on accepted work. For example, a 1 MON reward produces a 0.08 MON fee when accepted. This is an illustrative testnet example, not validated pricing or proven revenue. Future possibilities include sponsored dataset campaigns and licensing datasets with clear contributor permission.

## Tech stack

- Solidity + Foundry
- Next.js + TypeScript + Tailwind CSS
- viem for Monad interactions
- Browser local storage for the baseline demo; optional Supabase persistence

## Monad Testnet configuration

The event brief lists the following settings; check with the organizers if they announce an update:

- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Faucet: `https://faucet.monad.xyz`

## Run locally

### Contracts

```bash
cd contracts
forge build
forge test -vv
```

### Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the public factory address to `.env.local` after the operator deploys the contract. Check `package.json` for the exact scripts available in this repository.

## Deploy

1. Create a fresh burner wallet for the hackathon and fund it from the Monad Testnet faucet.
2. Deploy `TuturFactory` to Monad Testnet. The human operator signs deployment using Remix or an encrypted Foundry keystore. Never paste a private key or seed phrase into an AI agent or commit it to Git.
3. Configure treasury and three distinct validator addresses. The demo fee is `800` basis points (8%).
4. Verify the contract source on the explorer if verification is available.
5. Update the public factory address in the frontend environment and redeploy the web app.
6. Test a full live flow: create task → submit contribution → two validator votes → payout. Test rejection/refund and expiry when time permits.
7. Replace every placeholder in this README with real URLs, addresses, and transaction hashes.

## Required environment variables

See `.env.example`. Only public addresses and public RPC/config values belong in `NEXT_PUBLIC_*` variables. Never put private keys, seed phrases, or service-role credentials in frontend environment variables.

## Limitations and safety

- This is a hackathon prototype, not audited production software.
- Three trusted validators are configured for the demo. Collusion and Sybil resistance are not solved.
- Language quality is determined by human validators; AI is not an authoritative judge.
- Contributors must have the right to submit their data and understand the usage terms. The MVP checkbox is not a substitute for legal review.
- Do not submit personal, private, or sensitive data. Raw text is not intended to be stored on-chain.
- Campaign demand and the 8% price point are hypotheses and need customer validation.

## Demo checklist

- [ ] Public web app loads.
- [ ] Wallet connects to Monad Testnet.
- [ ] Factory address appears in the UI and README.
- [ ] A real create-task transaction confirms.
- [ ] A contribution is submitted and its hash is visible.
- [ ] Two valid validators approve and the payout transaction confirms.
- [ ] Explorer links open the actual transactions.
- [ ] Demo video is at least 30 seconds and shows the product running.
- [ ] X or LinkedIn post tags `@monad`, `@monad_dev`, and `@geeky_kartikey`.
