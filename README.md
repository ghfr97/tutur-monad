# TUTUR

**Verifiable micro-bounties for local-language data.** Sponsors fund a task, contributors submit language examples, validators review the result, and accepted contributions are paid through an escrow contract on Monad.

> Hackathon prototype for Monad Testnet. Testnet MON is not real-money revenue. This software is not audited or production-ready.

## Repository status

- Smart contracts: Solidity + Foundry in [`contracts`](./contracts).
- Frontend: Next.js + TypeScript + Tailwind + wagmi/viem in [`web`](./web).
- Metadata: browser local storage for the P0 demo. Metadata is not synchronized across devices.
- Product and implementation docs: [`PRD.md`](./PRD.md), [`architecture.md`](./architecture.md), [`plan.md`](./plan.md), and [`task.md`](./task.md).

The factory and per-task escrow source and tests are included. The configured factory address has bytecode on Monad Testnet. The operator has reported a successful task creation, validator approval, and contributor payout; transaction hashes have not yet been added to this README.

## Deployment references

The operator supplied the factory address below. Its bytecode was found on Monad Testnet, and RPC reads confirmed the three configured validators and 800 bps fee. The treasury getter could not be verified because the RPC returned an error. The operator has since reported that a task was created, two validators approved it, and the contributor received the reward. Add the real transaction hash and task address when available; do not treat this note as an independently verified transaction record.

- Live app: not published yet.
- GitHub repository: `ghfr97/MONAD`.
- Monad Testnet factory address: `0x2fE03DF63F9815D360C6e3f9bABA0a5dcF8334a5`.
- Factory explorer: https://testnet.monadexplorer.com/address/0x2fE03DF63F9815D360C6e3f9bABA0a5dcF8334a5
- Demo transaction: not documented yet.
- Demo video: not published yet.

## Product flow

1. A sponsor creates a task and escrows the reward plus the configured fee.
2. A contributor reads the prompt and explicit usage terms, submits text and explicitly consents.
3. Only the contribution hash and consent flag are sent on-chain; the text remains in this browser's local storage.
4. Three configured validators each vote once. Two matching votes decide the task.
5. Approval pays the contributor and treasury; rejection or an unresolved expiry refunds the full escrow to the sponsor.

Use only neutral, non-sensitive sample text. The usage terms and consent checkbox are product-level disclosures, not legal advice or a validated license.

## Monad Testnet

Check with event organizers before deployment in case values changed:

- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Faucet: `https://faucet.monad.xyz`
- Native currency: MON

## Prerequisites

- Node.js compatible with the installed Next.js version (Node 20.9+; Node 24 recommended).
- npm.
- Foundry (`forge`) to build and test contracts.
- A browser wallet with Monad Testnet configured.

## Run locally

### Contracts

From the repository root:

```powershell
Set-Location contracts
forge build
forge test -vv
```

Jika `forge` belum terpasang pada Windows, perintah sementara berikut menggunakan distribusi npm Foundry:

```powershell
Set-Location contracts
npx --yes --package @foundry-rs/forge forge build
npx --yes --package @foundry-rs/forge forge test -vv
```

### Frontend

```powershell
Set-Location web
Copy-Item ..\.env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The root `.env.example` currently contains the supplied factory address. Replace it only if using a different deployment, then copy it into `web/.env.local`. Restart the dev server after changing environment variables.

Frontend checks:

```powershell
npm run lint
npm run typecheck
npm run build
```

## Configure and deploy

Wallet-sensitive operations below must be performed and signed by the human operator. Do not provide a private key or seed phrase to the coding agent, and do not commit key material.

1. Create a fresh burner wallet for the testnet demo and request MON from the faucet.
2. Build and test from `contracts` with Foundry.
3. To deploy a new `TuturFactory`, use a human-operated workflow such as Remix or an encrypted Foundry keystore. The constructor arguments used for the current deployment are:
   - `treasury`: `0x00404e9F055595002Ea668AAFdA12111993190F6`
   - `validator1`: `0x097513cBdCCfbA5253cad3419587983d20000616`
   - `validator2`: `0xCC7968BFBCf01a11B771ff2D4B84b8bf13Aa0c2b`
   - `validator3`: `0xB133d509e5C07B8A1E0f17C87fDFA5655B501A3C`
   - `feeBps`: `800` (8%)

   The three validator addresses must be controlled by the intended reviewers; the app only checks that they match the validators configured in the deployed contracts. Validators are not paid from the treasury and need testnet MON in their own wallets to submit votes.
4. The current deployment address was supplied by the operator. Verify its source on the explorer if available; deploying again creates a different factory and does not replace the existing one.
5. Copy the root `.env.example` to `web/.env.local`. The factory address and public treasury/validator addresses are already filled in. Never put secrets in `NEXT_PUBLIC_*`.
6. Run the frontend locally and test create → submit → two validator votes → payout. Test rejection/refund or expiry as well.
7. Host the `web` application using the team's hosting provider. Configure the same public environment variables in that provider and rebuild.
8. Verify the public URL, factory address, and transaction links. Show explorer links only for real transaction hashes.

Suggested public variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_MONAD_CHAIN_ID` | Testnet chain ID (`10143`). |
| `NEXT_PUBLIC_MONAD_RPC_URL` | RPC used by the app for reads and gas estimation. |
| `NEXT_PUBLIC_MONAD_EXPLORER_URL` | Explorer base URL. |
| `NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS` | Factory address after operator deployment. |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Public treasury address for reference. |
| `NEXT_PUBLIC_VALIDATOR_1..3` | Public validator addresses for reference. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved for optional future metadata persistence; Supabase is not required by this MVP. |

Factory configuration (treasury, validators, fee) is immutable and read by the deployed contracts; changing environment values does not change deployed contract configuration.

### If MetaMask reports “Request is being rate limited”

The shared public Monad Testnet RPC can throttle requests. This message means the RPC refused a request; it does not by itself mean the contract reverted. The app shows a 30-second cooldown after a rate-limit response and does not automatically resend a transaction.

`NEXT_PUBLIC_MONAD_RPC_URL` is used by the app's public client for reads and gas estimation. MetaMask broadcasts wallet-signed transactions through the RPC configured in MetaMask, so changing only this environment variable may not resolve a wallet broadcast rate limit.

1. Wait for the app's retry countdown to finish, then retry once.
2. If the error persists, use a Monad Testnet RPC endpoint from a provider that supports testnet. Check the current list in [Monad's RPC provider docs](https://docs.monad.xyz/tooling-and-infra/rpc-providers.md); some providers require creating an account or API key.
3. In MetaMask, edit the Monad Testnet network and replace its RPC URL with your provider's Monad **Testnet** endpoint. Do not use a mainnet endpoint.
4. Confirm MetaMask still reports chain ID `10143` and currency `MON`, then reload the app.
5. Before trying again, check MetaMask Activity and the explorer to ensure the original transaction was not accepted. Do not force-send or repeatedly resubmit while its status is unclear.

If a provider uses an API key embedded in its endpoint URL, treat the URL as a credential: do not commit it or share screenshots containing it. Configure a separate local value for `NEXT_PUBLIC_MONAD_RPC_URL` only if the app's read/estimate requests also need that provider.

## Metadata and transaction behavior

- Task title, prompt, usage terms, and contribution text are stored in local storage on the current browser.
- Chain state is authoritative for addresses, escrow, vote counts, hashes, and task status.
- If metadata is unavailable on another browser, the app labels it as unavailable and does not invent content. Submission is disabled if the prompt/usage terms cannot be verified locally.
- The app estimates gas for contract writes and adds a small 10% buffer. Monad charges based on gas limit; avoid unnecessary limits.
- A transaction is not shown as confirmed until the RPC returns a successful receipt.
- Local metadata can be lost or remain on one device; this is a demo limitation.

## Limitations and safety

- Not audited and not suitable for mainnet or production funds.
- Three configured validators are trusted for this demo; collusion, conflicts, and Sybil resistance are not solved.
- Human validators assess language quality; automated adjudication is not provided.
- No legal validation of licensing, quality, or market demand. The 8% fee is a product hypothesis, not proven revenue.
- Do not submit names, addresses, private conversations, health data, voice recordings, or other sensitive information. Hashes do not make predictable text confidential.
- Independent task escrows are an architectural fit for exploring Monad execution, not a promise that all transactions execute in parallel or a TPS claim.

## Submission/demo checklist

- [ ] Public frontend loads and shows Monad Testnet.
- [ ] Factory deployed to Monad Testnet; source verified if available.
- [ ] Wallet connects and a real create-task transaction confirms.
- [ ] A contributor submission and two validator votes confirm.
- [ ] Payout or refund matches contract state.
- [ ] Factory/task addresses and actual explorer links are published.
- [ ] Demo recording shows the running product; do not fabricate transactions, usage, or analytics.
- [ ] Replace external submission placeholders only with verified real values.
