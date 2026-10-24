# TUTUR

**Verifiable micro-bounties for local-language data.** Sponsors fund a task, contributors submit language examples, validators review the result, and accepted contributions are paid through a smart contract on Monad.

> Hackathon prototype for Monad Blitz Jogja Vol. 2. Uses Monad Testnet; testnet MON is not real-money revenue. Unaudited, not production-ready.

## Links

> Do not submit with placeholder values. Use only addresses and hashes that actually exist.

- Live app: `REPLACE_WITH_PUBLIC_URL`
- GitHub repository: `REPLACE_WITH_PUBLIC_REPO_URL`
- Monad Testnet factory contract: `REPLACE_WITH_FACTORY_ADDRESS`
- Explorer: `https://testnet.monadexplorer.com/address/REPLACE_WITH_FACTORY_ADDRESS`
- Demo transactions (create / submit / vote / payout): `REPLACE_WITH_REAL_TRANSACTION_HASHES`
- Demo video: `REPLACE_WITH_VIDEO_URL`

## What it does

1. A sponsor funds a data task with native MON (reward + service fee).
2. A contributor submits a text contribution and acknowledges the task's usage terms.
3. Three configured validators review; two matching votes decide acceptance or rejection.
4. Accepted: reward to contributor, 8% fee to treasury. Rejected or expired: full refund to the sponsor.

Raw contribution text stays off-chain. The contract stores only a `keccak256` content hash plus payment/verification state.

## Contract architecture

`contracts/src/TuturFactory.sol` contains two contracts.

- **`TuturFactory`**: immutable treasury, three distinct validators and `feeBps` (default `800` = 8%, max `1000`). `createTask(metadataHash, rewardAmount, deadline)` requires `msg.value == reward + fee`, deploys a dedicated `TuturTask` escrow, records it for discovery and emits `TaskCreated`.
- **`TuturTask`**: one escrow per bounty. States `Open → Submitted → Paid | Rejected | Refunded`. Functions: `submitContribution(hash, agreedToTerms)`, `vote(approve)`, `refundAfterDeadline()`. Terminal state is set before any transfer (checks-effects-interactions); a failed transfer reverts everything. There is no admin or owner function that can move escrow funds.

Deviations/choices from the spec: factory enforces a minimum 5-minute task duration (the UI asks for 10); `quoteFee()` view added; validators are stored as immutables in each task.

## Hash normalization (`lib/hashing.ts`, `tutur-norm-v1`)

Unicode NFC → trim → collapse all whitespace runs to one space → `keccak256` of UTF-8 bytes. Case and punctuation are preserved.

## Why Monad

Each data task has its own escrow, so transactions on unrelated tasks do not need to write to a shared payout queue. This is an architectural fit for Monad's optimistic parallel execution. It is not a claim that every transaction runs in parallel, or that only Monad can support the pattern. No throughput numbers are claimed; the optional concurrency experiment is not implemented.

## Revenue model (hypothesis)

An 8% service fee on accepted work, enforced in the contract. Example: 1 MON reward → 1.08 MON funded → 1 MON to contributor, 0.08 MON to treasury. This is an illustrative testnet example, not validated pricing or revenue.

## Tech stack

Solidity 0.8.24 + Foundry · Next.js (App Router) + TypeScript + Tailwind CSS v4 · viem · browser `localStorage` for off-chain metadata.

## Run locally

```bash
# contracts
cd contracts
forge install foundry-rs/forge-std --no-git   # test dependency (contracts/lib is git-ignored)
forge build
forge test -vv
cd ..

# frontend
npm install
cp .env.example .env.local     # then set the public factory address after deployment
npm run dev
npm run lint && npm run typecheck && npm run build
```

Optional local end-to-end check of contracts + app ABI/hashing (no keys; uses Anvil's unlocked accounts):

```bash
anvil &                                  # separate terminal
npx tsx scripts/integration-local.ts
```

If you change the contracts, run `forge build` then `npm run abi` to refresh `lib/abi.ts`.

## Deploy (human-operated; never share keys with an AI agent)

1. Create a fresh **burner** wallet for the hackathon. Fund it at https://faucet.monad.xyz.
2. Choose public addresses for the treasury and three **distinct** validators (team test wallets).
3. Import the burner key into an encrypted Foundry keystore (prompted locally, not stored in shell history):
   ```bash
   cast wallet import tutur-burner --interactive
   ```
4. Deploy:
   ```bash
   cd contracts
   TREASURY=0x... VALIDATOR1=0x... VALIDATOR2=0x... VALIDATOR3=0x... \
   forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz \
     --account tutur-burner --broadcast
   ```
   (Remix with the same constructor args also works.)
5. Verify the source on the explorer if verification is available.
6. Put the printed address in `.env.local` as `NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS`, and in the host's environment variables (e.g. Vercel). Redeploy the web app.
7. Run the full live flow with real wallets: create → submit → two validator votes → payout. Also try rejection and expiry. Save the real transaction hashes.
8. Replace every placeholder in this README.

## Environment variables

See `.env.example`. Only public values belong in `NEXT_PUBLIC_*`. Never add private keys, seed phrases or service-role keys.

## Monad Testnet configuration

Chain ID `10143` · RPC `https://testnet-rpc.monad.xyz` · Explorer `https://testnet.monadexplorer.com` · Faucet `https://faucet.monad.xyz`. Check with the organizers for updates.

## Status / limitations

- Contracts: 25 Foundry tests pass (happy path, unauthorized and double voting, duplicate submission, wrong payment, rejection refund, expiry, fee rounding, atomic revert on failed transfer).
- Local Anvil integration script passes using the same ABI and hashing code as the app.
- **Not yet tested:** the browser UI with a real wallet on Monad Testnet (requires the operator's deployment), contract source verification, and public hosting.
- Not implemented: Supabase shared metadata, event-based activity feed, concurrency experiment.
- Off-chain metadata lives in browser localStorage: another browser sees on-chain state with "metadata unavailable on this device".
- Three trusted validators; collusion and Sybil resistance are unsolved. Language quality is judged by humans. The consent checkbox is not legal review. Do not submit personal or sensitive data. Demand and the 8% price are hypotheses.
- Task list reads up to the latest 30 tasks directly from RPC (no indexer).

## Demo checklist (3 minutes)

- [ ] Public web app loads
- [ ] Wallet connects to Monad Testnet (switch-network prompt works)
- [ ] Factory address appears in UI and README
- [ ] Create task: reward, 8% fee and total shown before signing; receipt confirms
- [ ] Contributor submits text with consent; hash visible
- [ ] Two validators vote; payout confirms; explorer links open real transactions
- [ ] Mention rejection/expiry refund behaviour
- [ ] Demo video ≥ 30 s
- [ ] X/LinkedIn post tags `@monad`, `@monad_dev`, `@geeky_kartikey`
