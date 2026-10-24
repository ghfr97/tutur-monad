# TUTUR — Developer Pack / Product & Build Spec

**Event context:** Monad Blitz Jogja, 24 October 2026  
**Build window:** 6 hours  
**Team:** 3 builders using AI coding agents  
**Project type:** Language-data micro-bounties with on-chain escrow, independent verification, and automatic payouts  
**Status:** Hackathon MVP brief; not a production security or legal specification

---

## 1. Executive brief

### One-line pitch

**TUTUR turns local-language data collection into verifiable micro-bounties: sponsors fund small tasks, contributors submit licensed contributions, validators review them, and smart contracts pay for accepted work.**

### Problem

AI builders, researchers, and language communities may need reliable language examples for translation, speech, and language-model evaluation. Collecting useful local-language data requires more than gathering text: the source, consent, quality review, and compensation process need to be clear. Low-resource languages and regional registers can be overlooked by data collection pipelines designed around major languages.

### Proposed solution

TUTUR lets a sponsor fund an individual data task, such as translating a short neutral sentence into a specified Javanese register. A contributor submits a text contribution and confirms the task's usage terms. Three designated validators can review the contribution; two matching votes determine acceptance or rejection. Accepted work triggers a reward payment and an 8% platform fee. Rejected or expired tasks refund the sponsor.

### What TUTUR is not

- Not a trained AI model.
- Not a claim that all submitted language data is automatically correct.
- Not a production-ready legal licensing system.
- Not a token launch, DAO, or generic donation app.
- Not dependent on speculative TPS claims.

### Product principle

Blockchain should enforce the escrow, transparent state transitions, and payout. The frontend should make the workflow understandable. Text content and metadata stay off-chain; the chain stores hashes and payment/verification state needed for auditability.

---

## 2. Target users and value

### Primary paying customer

A company building language AI, a research lab, a university project, or an organization commissioning a language dataset.

### Contributors

Native or fluent speakers who can provide translations, phrasing, register examples, or other requested language data and who are willing to agree to clear usage terms.

### Validators

Trusted language reviewers assigned to a task. For the hackathon demo, use three team-controlled test wallets. In production, validator selection, conflict of interest, dispute handling, and Sybil resistance would need further design.

### Why a customer could pay

TUTUR offers a structured collection workflow, evidence of contribution provenance, transparent rewards, and a repeatable verification process. These are hypotheses to validate with prospective customers; do not describe customer demand as proven.

---

## 3. Revenue model

### MVP model: success-based service fee

- Platform fee: **8% of the task reward**, configurable at factory deployment in basis points (`800` = 8%).
- Sponsor sends `reward + fee` when creating a task.
- If the contribution is accepted, the contributor receives the reward and the treasury receives the fee.
- If the task is rejected or expires without a decision, the sponsor receives the full escrow balance, including the fee.
- The treasury address is fixed at factory deployment. Do not add an admin withdrawal function for the MVP.

### Later revenue possibilities (not MVP scope)

1. Campaign setup and management fees for dataset collection.
2. Dataset licensing under contributor-approved terms.
3. Paid API access and verification services.

### Revenue example

For a task with a reward of 1 MON, an 8% fee is 0.08 MON. On acceptance, 1 MON goes to the contributor and 0.08 MON goes to treasury. This is an illustrative testnet example, not market pricing or a revenue forecast.

---

## 4. Chain and hackathon requirements

Use the event brief's Monad Testnet details unless the organizers provide an updated value during the event:

- Chain name: Monad Testnet
- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Faucet: `https://faucet.monad.xyz`
- Native currency: MON

The event brief requires a public repository, a usable README, smart contracts deployed on Monad during the event, a publicly hosted working web app, and the contract address in the README. For the advanced score, prioritize working functions, a live on-chain transaction during the demo, contract source verification, and instructions that another developer can follow.

**Submission freeze shown in the brief:** 4:45 PM. Treat it as hard; prioritize submission completeness over new features.

---

## 5. MVP scope

### P0 — Must work end-to-end

1. Connect wallet and switch to Monad Testnet.
2. Create one data-task bounty with title, prompt, target language/register, reward, and deadline.
3. Fund the escrow in native MON, including the service fee.
4. Submit one contribution text, an on-chain hash of the content, and an explicit terms-consent acknowledgement.
5. Allow three configured validator addresses to vote approve/reject, each only once.
6. Two approvals pay the contributor and treasury. Two rejections refund the sponsor.
7. If the deadline passes before a result, the sponsor can trigger a refund.
8. Show task status, sponsor, reward, fee, contribution hash, votes, contract address, and real explorer links.
9. Public repo, readable README, deployable public web app, and an on-chain factory address.

### P1 — Only after P0 works

- Supabase persistence for public task metadata and contribution text, with suitable access policies.
- A simple “recent activity” panel based on contract events.
- One controlled concurrency experiment with honest measurements.
- Social post and a 30-second-or-longer demo recording.

### P2 — Explicitly out of scope

- Audio capture, biometric data, or personal/sensitive data.
- Custom token, DAO voting, staking, NFT badges, fiat payments.
- Multi-chain support, mobile app, complex indexing service, custom AI model.
- Automated AI adjudication of contribution quality.
- Claims of full legal compliance or production readiness.

---

## 6. Core user journey

### Sponsor flow

1. Open “Create task”.
2. Enter a concise task title, source prompt, target language/register, reward amount, and deadline.
3. UI calculates `fee = reward * feeBps / 10_000` and total payable.
4. User reviews total and signs the transaction.
5. After a confirmed receipt, the task appears with its child escrow address and a link to the explorer.
6. Sponsor can monitor status and refund if the deadline has passed and the task is still unresolved.

### Contributor flow

1. Open a task that is in `Open` status and has not expired.
2. Read the prompt and usage terms.
3. Enter a text contribution. For this MVP, do not accept audio or uploads.
4. Confirm: “I have the right to submit this contribution and I agree to the task's stated usage terms.” The checkbox must not be pre-checked.
5. Frontend hashes the normalized contribution text with `keccak256` (use one documented normalization routine and reuse it consistently).
6. Store the actual contribution text off-chain; submit only the hash and terms acknowledgement on-chain.
7. After confirmation, show the transaction and pending verification status.

### Validator flow

1. A connected wallet must equal one of the three validator addresses configured in the factory.
2. Validator reviews the contribution off-chain and submits either approve or reject.
3. Each validator can vote once per task.
4. Two approvals finalize acceptance and payment. Two rejections finalize rejection and refund.
5. The UI refreshes on-chain state after receipt confirmation.

---

## 7. Smart-contract specification

Use Solidity and Foundry. Keep the factory and task escrow implementation in a source file that is easy to verify. Avoid unnecessary dependencies. Exact implementation details can change if the agent identifies a security or compiler issue, but preserve the behavior below and document any deviation.

### Contract A: `TuturFactory`

Responsibilities:

- Store immutable treasury and fee basis points.
- Store three validator addresses set at deployment.
- Create a new independent `TuturTask` escrow contract for each bounty.
- Store task addresses for discovery.
- Emit a `TaskCreated` event containing task address, sponsor, metadata hash, reward, fee, and deadline.

Suggested constructor:

```solidity
constructor(
    address treasury_,
    address validator1_,
    address validator2_,
    address validator3_,
    uint16 feeBps_
)
```

Validation:

- Treasury and validators cannot be the zero address.
- Validators must be distinct.
- `feeBps_` must be greater than zero and no more than `1000` (10%). Use `800` for the demo.

Suggested external interface:

```solidity
function createTask(
    bytes32 metadataHash,
    uint256 rewardAmount,
    uint64 deadline
) external payable returns (address taskAddress);

function getTaskCount() external view returns (uint256);
function taskAt(uint256 index) external view returns (address);
```

`createTask` behavior:

- `rewardAmount > 0`.
- Metadata hash must not be zero.
- Deadline must be in the future with enough time for a meaningful task.
- `feeAmount = rewardAmount * feeBps / 10_000`; require `feeAmount > 0` so the demo cannot create a paid task whose rounded fee is zero.
- Require `msg.value == rewardAmount + feeAmount`.
- Deploy a new `TuturTask` with sponsor, treasury, reward, fee, deadline, metadata hash, and the three validators. Forward the exact `msg.value` to the new task.
- Add the child address to the task list and emit the event.

### Contract B: `TuturTask`

Each task is its own escrow. It accepts one contribution, which is enough for the six-hour demo and reinforces the independent-task architecture.

Suggested enum:

```solidity
enum Status { Open, Submitted, Paid, Rejected, Refunded }
```

Required public state or getters:

- `sponsor`
- `treasury`
- `rewardAmount`
- `feeAmount`
- `deadline`
- `metadataHash`
- `contributor`
- `contributionHash`
- `status`
- `approvals`
- `rejections`
- per-validator `hasVoted` information

Required functions:

```solidity
function submitContribution(bytes32 contentHash, bool agreedToTerms) external;
function vote(bool approve) external;
function refundAfterDeadline() external;
```

Behavior and invariants:

- Initial status is `Open`; escrow balance equals reward plus fee.
- Only one submission is allowed. It requires `Open`, before deadline, a nonzero content hash, a contributor other than the sponsor, and `agreedToTerms == true`.
- A submission records the contributor and hash, moves status to `Submitted`, and emits `ContributionSubmitted`.
- Only one of the three configured validators may vote; each may vote once, and voting is allowed only while status is `Submitted` and before the deadline.
- Two approve votes: set terminal status before external transfers; pay reward to contributor and fee to treasury; emit a finalization/payment event.
- Two reject votes: set terminal status before transfer; return the full escrow balance to sponsor; emit rejection/refund event.
- If `block.timestamp > deadline` and status is `Open` or `Submitted`, anyone may call `refundAfterDeadline`; set status to `Refunded` before refunding the full balance to sponsor.
- No function may pay twice or change a terminal status.
- Use checks-effects-interactions. Verify each native-token transfer succeeds; otherwise revert atomically.
- Do not add an owner function that can confiscate escrow funds.

Suggested events:

```solidity
event ContributionSubmitted(address indexed contributor, bytes32 indexed contentHash, bool agreedToTerms);
event ValidatorVoted(address indexed validator, bool approve, uint256 approvals, uint256 rejections);
event TaskFinalized(Status status, address indexed recipient, uint256 rewardPaid, uint256 feePaid);
event SponsorRefunded(address indexed sponsor, uint256 amount);
```

The factory should emit:

```solidity
event TaskCreated(
    address indexed taskAddress,
    address indexed sponsor,
    bytes32 indexed metadataHash,
    uint256 rewardAmount,
    uint256 feeAmount,
    uint64 deadline
);
```

### Security test cases — required

- Creating task with insufficient or excess payment reverts.
- Zero reward, zero metadata hash, invalid validators, or invalid fee rate reverts.
- Only a configured validator can vote.
- A validator cannot vote twice.
- A contributor cannot submit twice.
- Sponsor cannot submit as contributor.
- Terms acknowledgement must be true.
- Only one payout/refund can happen.
- Two approvals pay exactly reward to contributor and fee to treasury.
- Two rejections refund full balance to sponsor.
- Deadline refund works for unresolved task and cannot run early.
- Voting or submission after expiry is rejected.
- Failed transfer reverts state changes atomically.

Use Foundry unit tests. Do not spend hackathon time on a complex fuzzing suite before these deterministic tests pass.

---

## 8. Off-chain metadata and data handling

The chain should not store raw contribution text. Store only hashes and the minimum state needed for payment and auditability.

### Metadata fields

- `taskAddress`
- `title`
- `prompt`
- `sourceLanguage`
- `targetLanguage`
- `registerOrDialect`
- `usageTermsVersion`
- `createdAt`
- `contributionText` (off-chain only)
- `contributorWallet`
- `consentAt`
- `consentVersion`
- `contentHash`

### Persistence strategy

- Baseline: local storage, so the demo works without configuring a database.
- Optional P1: Supabase for shared metadata. If Supabase is used, add a schema and Row Level Security policies; never expose a service-role key to the browser.
- If a task exists on-chain but its metadata is unavailable in the current browser, render “Metadata unavailable on this device” and still show the task address, sponsor, reward, status, hash, and explorer link. Never fabricate a title or contribution.

### Data ethics guardrails

- Keep the MVP text-only and use non-sensitive example sentences.
- Do not solicit names, addresses, private conversations, health data, or other sensitive information.
- Make the intended use of the contribution clear before consent.
- The checkbox is only a product-level acknowledgement; it is not a substitute for a reviewed legal agreement.
- Before production, review data ownership, licensing, revocation, privacy, consent records, and applicable laws with qualified counsel.

---

## 9. Frontend design and routes

### Stack

- Next.js + TypeScript
- Tailwind CSS
- `viem` for chain interactions and hashing; use `wagmi` only if it speeds up wallet integration without excessive setup
- Foundry for contracts
- Optional Supabase, only after the core flow works

### Suggested routes

- `/` — landing page, short explanation, network status, CTA to view tasks
- `/tasks` — list of task escrows with status, reward, fee and deadline
- `/tasks/new` — create a task
- `/tasks/[address]` — contribution form, validator actions, escrow details, event/transaction links
- `/about` or a small section on the home page — explain revenue model and data handling

### Visual direction

- Editorial and trustworthy rather than casino-like Web3.
- Warm off-white or deep ink background, one restrained accent color, strong typography, clean table/card rhythm.
- Show real task states and real values. Never create fake user counts, fake volume charts, fake testimonials, or fake benchmark numbers.
- Keep navigation and forms compact. Prioritize a legible three-minute demo.
- Include a clear “Monad Testnet” indicator to avoid confusion with real funds.

### Required UI states

- Wallet disconnected; wrong network; switch-network action.
- Form validation; insufficient balance; rejected wallet request.
- Pending transaction; confirmed transaction; reverted transaction.
- Task `Open`, `Submitted`, `Paid`, `Rejected`, `Refunded`.
- Not a validator; already voted; contribution already submitted; deadline passed.
- Metadata unavailable; optional database unavailable.

### Transaction UX

1. Show estimated reward, service fee, and total before opening the wallet.
2. Await receipt confirmation; do not mark success immediately after `writeContract` returns a hash.
3. On success, show hash and explorer link.
4. Refresh contract reads after the receipt.
5. Display useful revert/error messages without leaking stack traces to the user.

---

## 10. Monad-specific experiment

The project should demonstrate a reasoned fit for Monad, not make an unsupported claim that only Monad can execute the design.

### Architecture idea

Each task is a distinct escrow contract with its own reward balance and state. A submission or vote for Task A does not need to modify Task B's storage. Avoid a shared per-task global counter or one global payout queue that every task must update.

### Optional concurrency demo (only after core workflow works)

- Create at least 3 independent tasks.
- From separate funded burner wallets, perform transactions against different task addresses, where practical.
- Record submitted transaction hashes, successful receipts, the time window used, and failed transactions.
- Display the sample size and method. Do not call a tiny sample a network TPS benchmark.
- If timing measurements are taken in the browser, label them as end-to-end client-observed latency, not protocol finality.

Parallel execution is an architectural fit, not a promise that every transaction runs in parallel. State conflicts, wallet nonce handling, RPC behavior, and block scheduling can affect measurements.

---

## 11. Repository structure

Suggested structure; adapt if the starter repository already has a sensible layout:

```text
.
├── AGENTS.md
├── TUTUR_DEVELOPER_PACK.md
├── README.md
├── README_TEMPLATE.md
├── .env.example
├── contracts/
│   ├── foundry.toml
│   ├── src/TuturFactory.sol
│   └── test/TuturFactory.t.sol
├── app/                  # Or src/app, according to Next.js scaffold
├── components/
├── lib/
│   ├── chain.ts
│   ├── contracts.ts
│   ├── hashing.ts
│   └── metadata-store.ts
└── public/
```

If the app uses a root-level Foundry `src/` and Next.js also uses `src/`, choose clear folder names to avoid collision (for example `contracts/src/` for Solidity).

---

## 12. Environment configuration

Create `.env.example` with placeholders only:

```dotenv
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadexplorer.com
NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS=0xREPLACE_AFTER_DEPLOYMENT
NEXT_PUBLIC_TREASURY_ADDRESS=0xREPLACE_WITH_TREASURY
NEXT_PUBLIC_VALIDATOR_1=0xREPLACE_WITH_VALIDATOR_1
NEXT_PUBLIC_VALIDATOR_2=0xREPLACE_WITH_VALIDATOR_2
NEXT_PUBLIC_VALIDATOR_3=0xREPLACE_WITH_VALIDATOR_3
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never put a private key or seed phrase in this file. Do not create a `NEXT_PUBLIC_*` variable for any secret. If an optional server-side secret is introduced, explain why it exists and keep it out of client bundles and version control.

---

## 13. Build and deploy sequence

The human operator must perform wallet-sensitive actions. The coding agent can prepare contracts, scripts, ABI integration, and exact instructions, but must not ask for or handle a private key.

1. Inspect the repository and install dependencies.
2. Compile and test contracts locally with Foundry.
3. Run the frontend locally and complete a UI flow using local sample metadata.
4. Create a fresh burner wallet only for this hackathon; never use a personal main wallet.
5. Obtain testnet MON from the faucet in the event brief.
6. Deploy the factory to Monad Testnet using Remix or an encrypted Foundry keystore. The operator signs deployment themselves.
7. Record the deployed factory address and verify the source on the Monad explorer if verification is available during the event.
8. Update the frontend's public factory address and rebuild/redeploy the web app.
9. Run the actual create → submit → two votes → payout flow on testnet. Save the real transaction hashes.
10. Add the public repository, live web URL, factory address, chain ID, and demo transaction links to README.
11. Confirm that deployment happened within the event timeline, as required by the brief.

Suggested commands (adjust to the generated project; never add secrets to the command history):

```bash
# Contract tests
cd contracts
forge build
forge test -vv

# Frontend checks from the frontend root
npm run lint
npm run typecheck   # if defined
npm run build
```

The exact hosting provider is a team choice. Use the fastest reliable public deployment path already available to the team; a custom domain is not required for basic eligibility.

---

## 14. Three-person work split

### Builder A — smart contracts

- Implement and test the factory and escrow behavior.
- Keep contract interfaces stable early; communicate the ABI/address as soon as a local build works.
- Prepare verification and human-operated deployment instructions.

### Builder B — frontend

- Build the visual shell, wallet/network states, create task, detail page, submission, and vote panels.
- Use sample metadata until the contract interface is stable.
- Wire the final ABI and confirm each transaction state from receipts and contract reads.

### Builder C — integration, metadata, shipping

- Implement hashing and local metadata store; add Supabase only if time permits.
- Write README and `.env.example`, deploy public frontend, prepare demo tasks and burner wallets.
- Test the end-to-end path, collect transaction links, create the video/social post.

All three should coordinate on a small shared interface early: ABI, event names, contract address config, task metadata fields, hash normalization function.

---

## 15. Six-hour plan and cut line

| Elapsed | Target |
|---|---|
| 00:00–00:30 | Inspect starter, scaffold, agree ABI/events and design. |
| 00:30–02:00 | Contract compile/tests; frontend shell in parallel. |
| 02:00–03:30 | Deploy first testnet factory, wire create and task reads, add submission/voting. |
| 03:30–04:30 | Complete payout/refund, run tests and real testnet flow, host app, fill README. |
| 04:30–05:30 | Verify source, polish critical UX, capture actual tx links, record demo and post. |
| 05:30–06:00 | Regression check and submit. Freeze features. |

### Cut line

If time becomes tight, remove Supabase and the concurrency dashboard before removing payout logic, real transactions, README, or public deployment. Local storage is acceptable for the hackathon demo if its limitation is documented.

---

## 16. Acceptance checklist

### Product

- [ ] A sponsor can create and fund a bounty.
- [ ] The reward and 8% fee are displayed accurately before signing.
- [ ] A contributor can submit text and explicitly acknowledge terms.
- [ ] The app submits only a content hash on-chain, not the raw text.
- [ ] Three designated validators can vote once each.
- [ ] Two approvals pay contributor and treasury exactly once.
- [ ] Two rejections refund the sponsor exactly once.
- [ ] Deadline expiry allows unresolved funds to be refunded.
- [ ] Task status and real explorer links reflect on-chain data.

### Technical

- [ ] Factory compiles and is tested.
- [ ] Important revert/security cases are covered.
- [ ] App lint/typecheck/build checks pass, or any remaining failure is clearly documented.
- [ ] No secrets in Git or frontend environment variables.
- [ ] No fake confirmations or invented analytics.

### Submission

- [ ] Public GitHub repo.
- [ ] README setup, product explanation, and run instructions.
- [ ] Factory contract deployed on Monad during Blitz.
- [ ] Contract source verified if tooling is available.
- [ ] Public live web app.
- [ ] Deployed address included in README.
- [ ] One real transaction path tested on the live app.
- [ ] Demo recording of 30 seconds or more, product running.
- [ ] X or LinkedIn post tags `@monad`, `@monad_dev`, and `@geeky_kartikey`.

---

## 17. Three-minute demo script

**0:00–0:25 — Problem**  
“AI builders need reliable language data, but collection, consent, quality review, and contributor compensation are fragmented. TUTUR turns the smallest unit of language data into a verifiable task.”

**0:25–1:00 — Sponsor funds work**  
Create a task live (or show the just-completed live transaction), display reward, 8% fee, escrow address, and factory address.

**1:00–1:45 — Contribution and review**  
Submit a short sample text with terms consent. Switch to two validator wallets and vote. Show the state update after real receipts.

**1:45–2:20 — Payment proof**  
Show the contributor payout, treasury fee, and explorer. Also explain the rejection/expiry refund behavior briefly.

**2:20–3:00 — Why Monad and how it makes money**  
“Each data task gets an isolated escrow, so unrelated tasks do not need to mutate a shared payout queue. We designed the workflow for independent on-chain actions and measured the transactions we actually ran. Customers can fund dataset campaigns; TUTUR's initial revenue model is an 8% fee on accepted work.”

Do not claim “only Monad can do this.” Show the architecture and evidence instead.

---

## 18. Prompt to give the coding agent

Paste this after adding `AGENTS.md` and this spec to the repository:

> Read `AGENTS.md` and `TUTUR_DEVELOPER_PACK.md` completely. Inspect the repository before editing. Implement the P0 acceptance checklist with the smallest maintainable solution. Start with the contract interface and tests, then build the frontend around the real contract calls. Do not ask me to decide minor details; use the spec defaults. Do not add features outside P0 until the full create → submit → vote → payout/refund path works. Do not fabricate transaction success or benchmark figures. Never request, read, print, or commit private keys; provide human-operated deployment steps only. Run available tests and build checks, fix critical errors, and keep the README updated with commands and placeholders for the factory address, live URL, and real transaction hashes. At the end, report what works, what is incomplete, the checks run, and the exact remaining steps for a human to deploy and submit.
