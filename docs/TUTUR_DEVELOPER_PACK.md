# TUTUR — Developer Pack

**Event context:** Monad Blitz Jogja Vol. 2  
**Build window:** 6 hours  
**Team:** 3 people using AI coding agents  
**Project:** Language-data micro-bounties with on-chain escrow, verification, and payouts  
**Status:** Hackathon MVP specification; not a production security or legal specification.

## 1. Product brief

**One-line pitch:** TUTUR turns local-language data collection into verifiable micro-bounties: sponsors fund tasks, contributors submit licensed contributions, validators review them, and smart contracts pay accepted work.

AI developers and researchers may need reliable language examples for translation, language models, and evaluation. Collecting them requires clear task definitions, contributor consent, quality review, and compensation.

TUTUR structures this process into small tasks with transparent on-chain funding and payout state.

### What it is not

- Not a trained AI model.
- Not a claim that submitted data is automatically correct.
- Not a production-ready legal licensing system.
- Not a token launch or generic donation app.
- Not a reason to make unsupported performance claims.

## 2. Users and value

- **Paying customer hypothesis:** AI companies, research labs, universities, or organizations commissioning language data.
- **Contributors:** Native or fluent speakers who can provide requested language examples.
- **Validators:** Reviewers assigned to assess contributions.

TUTUR's value hypothesis is a structured collection workflow, provenance hashes, human review, and transparent rewards. Customer demand must be validated; do not claim traction without evidence.

## 3. Revenue model

Initial hypothesis: an **8% service fee on accepted tasks**.

Example:
- Reward: 1 MON
- Fee: 0.08 MON
- Total funding: 1.08 MON

On acceptance, pay 1 MON to the contributor and 0.08 MON to treasury. On rejection or unresolved expiry, refund the sponsor the full escrow balance, including the fee.

Possible later revenue: campaign management fees, dataset licensing with contributor-approved terms, and API/verification services. These are not P0.

## 4. Monad Testnet configuration

Use the event brief's details unless organizers announce updates:

- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Faucet: `https://faucet.monad.xyz`
- Currency: MON

The human operator deploys contracts using a burner wallet and signs transactions. Never share a private key or seed phrase with an AI agent.

## 5. P0 scope

1. Connect wallet and switch to Monad Testnet.
2. Sponsor creates a language task and funds native MON escrow.
3. Contributor submits text, content hash, and explicit terms acknowledgement.
4. Three configured validators may vote once each.
5. Two approvals pay contributor and treasury.
6. Two rejections refund sponsor.
7. Expired unresolved tasks can be refunded.
8. UI shows task status, sponsor, reward, fee, deadline, votes, hash, contract address, and real explorer links.
9. Public repository, useful README, public web deployment, and factory address.

### Out of scope

Custom token, DAO, NFT badges, staking, audio recording, mobile app, complex indexing, AI adjudication, and mainnet deployment.

## 6. Contract design

Use Solidity and Foundry, with minimal dependencies.

### `TuturFactory`

Responsibilities:
- Store treasury, three distinct validators, and fee basis points.
- Create an independent `TuturTask` escrow for each task.
- Track task addresses and emit `TaskCreated`.

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

Use `800` basis points (8%) for the demo. Reject zero addresses, duplicate validators, and fee rates above `1000` basis points.

Suggested interface:

```solidity
function createTask(
    bytes32 metadataHash,
    uint256 rewardAmount,
    uint64 deadline
) external payable returns (address taskAddress);

function getTaskCount() external view returns (uint256);
function taskAt(uint256 index) external view returns (address);
```

Require nonzero reward and metadata hash, future deadline, fee greater than zero after rounding, and `msg.value == rewardAmount + feeAmount`.

### `TuturTask`

Each task has its own escrow. Suggested states:

`Open`, `Submitted`, `Paid`, `Rejected`, `Refunded`.

Required behavior:
- One contribution submission with a nonzero content hash and explicit terms acknowledgement.
- Sponsor cannot submit as contributor.
- Only configured validators can vote; each votes once.
- Two approvals finalize and pay contributor reward plus treasury fee.
- Two rejections finalize and refund the sponsor.
- If deadline passes while unresolved, anyone can trigger a full sponsor refund.
- Set terminal state before external transfers.
- Use checks-effects-interactions and revert atomically on failed transfers.
- No arbitrary owner withdrawal or double payout.

Suggested functions:

```solidity
function submitContribution(bytes32 contentHash, bool agreedToTerms) external;
function vote(bool approve) external;
function refundAfterDeadline() external;
```

Suggested events: `TaskCreated`, `ContributionSubmitted`, `ValidatorVoted`, `TaskFinalized`, and `SponsorRefunded`.

### Required tests

- Wrong payment amount reverts.
- Invalid reward/hash/validators/fee reverts.
- Unauthorized voting reverts.
- Double voting and duplicate submission revert.
- Sponsor cannot submit as contributor.
- Missing consent reverts.
- Two approvals pay exact reward and fee once.
- Two rejections refund full escrow once.
- Early refund reverts; expiry refund works.
- Submission/voting after deadline is rejected.
- Failed transfers revert state changes atomically.

## 7. Off-chain data and consent

Keep raw contribution text off-chain. Store only a content hash and minimum payment/verification state on-chain.

Metadata can include task title, prompt, source/target language, register/dialect, usage terms version, contribution text, contributor wallet, consent version, and content hash.

Baseline: local storage. Optional: Supabase only after the core flow works, with proper Row Level Security and no service-role key in the browser.

If metadata is missing, show “Metadata unavailable on this device” and still display available on-chain state. Never invent metadata.

Use non-sensitive sample sentences. Do not solicit private conversations or personal/sensitive information. Consent acknowledgement is not a substitute for legal review.

## 8. Frontend routes

- `/` — product landing page and explanation
- `/tasks` — task list and status
- `/tasks/new` — create bounty form
- `/tasks/[address]` — details, contribution form, validator actions, on-chain state
- About section — revenue, data handling, limitations

Suggested stack: Next.js, TypeScript, Tailwind CSS, viem; wagmi only if it reduces implementation time. Foundry for contracts.

Visual direction: editorial, trustworthy, language/research oriented. Use restrained colors, strong typography, clean cards/tables, and clear transaction states. Avoid fake metrics, fake testimonials, and generic speculative-token styling.

## 9. Monad-specific architecture

Each task has a separate escrow and state. Transactions involving unrelated tasks need not mutate one shared payout queue or reward balance. This is an architectural fit for exploring independent execution, not a guarantee every transaction runs in parallel.

Only after P0 works, optionally create several independent tasks and record actual transaction hashes, receipts, sample size, and client-observed latency. Do not call a small sample a protocol TPS benchmark.

## 10. Environment template

See the root `.env.example`. Public addresses and public RPC values may use `NEXT_PUBLIC_*`; private keys and seed phrases must never be placed in frontend variables.

## 11. Three-person split

- **Builder A:** Solidity, Foundry tests, deployment prep.
- **Builder B:** UI, wallet connection, contract integration.
- **Builder C:** metadata, integration testing, hosting, README, demo.

Keep ABI, event names, hash normalization, and metadata fields agreed early.

## 12. Six-hour plan

| Elapsed | Goal |
|---|---|
| 00:00–00:30 | Inspect starter, scaffold, agree ABI and design |
| 00:30–02:00 | Contracts/tests and frontend shell in parallel |
| 02:00–03:30 | Testnet deployment, create/read task, submit/vote |
| 03:30–04:30 | Payout/refund, real flow, host app, fill README |
| 04:30–05:30 | Verification, UX fixes, transaction links, demo |
| 05:30–06:00 | Regression and submission freeze |

Cut Supabase and the concurrency dashboard before cutting the working payout flow, tests, README, or public deployment.

## 13. Acceptance checklist

- [ ] Sponsor creates and funds task.
- [ ] Fee calculation is correct and visible.
- [ ] Contributor submits hash and acknowledges terms.
- [ ] Three validators can vote once each.
- [ ] Two approvals pay contributor and treasury exactly once.
- [ ] Two rejections refund sponsor.
- [ ] Expired unresolved task can be refunded.
- [ ] UI shows real on-chain state and explorer links.
- [ ] Contract tests and frontend build checks pass.
- [ ] No secrets are committed.
- [ ] README, `.env.example`, live app, and deployed factory address are ready.

## 14. Three-minute demo

1. Explain the local-language data problem.
2. Create a bounty and show reward, fee, escrow, and real transaction.
3. Submit a sample contribution with consent.
4. Vote using two validator wallets.
5. Show the confirmed payout and explorer.
6. Explain the 8% campaign service fee and independent task escrow design.

Do not claim “only Monad can do this”; demonstrate the architecture and actual evidence instead.
