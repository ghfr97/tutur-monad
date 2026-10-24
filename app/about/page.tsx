export default function About() {
  const h = "text-2xl font-semibold";
  const p = "mt-2 text-soft";
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl font-bold">About TUTUR</h1>
      <section><h2 className={h}>The problem</h2><p className={p}>Language models, translation and speech systems need dependable data in local languages and registers. Gathering it requires clear task definitions, contributor consent, human quality review and visible compensation. TUTUR explores making the smallest unit of that work a verifiable on-chain task.</p></section>
      <section><h2 className={h}>How review works</h2><p className={p}>Three validator wallets are fixed in the factory at deployment. After a contribution is submitted, each validator can vote once. Two matching votes finalize the task: approvals pay out, rejections refund the sponsor. Quality judgement is human; AI is not an authority here.</p></section>
      <section><h2 className={h}>The service fee</h2><p className={p}>The factory stores a fee in basis points (800 = 8%). The sponsor funds reward + fee. On acceptance the contract pays the reward to the contributor and the fee to the treasury. The treasury is fixed at deployment and there is no admin withdrawal function. The 8% rate is a business hypothesis, not validated pricing.</p></section>
      <section><h2 className={h}>Independent escrows</h2><p className={p}>Every task is its own contract with its own balance, contribution and votes, so a transaction on one task does not need to write to another task’s state. This suits Monad’s optimistic parallel execution as an architectural fit. It does not guarantee parallel execution, and it is not a claim that only Monad can run this design.</p></section>
      <section><h2 className={h}>Data handling</h2><p className={p}>Raw contribution text is never stored on-chain; only a keccak256 hash of the normalized text is. In this prototype, text and task metadata live in browser local storage, so another browser sees on-chain state but “metadata unavailable on this device”. Do not submit personal or sensitive data. The consent checkbox is a product-level acknowledgement, not a reviewed legal licence.</p></section>
      <section><h2 className={h}>Prototype limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-soft">
          <li>Unaudited hackathon code on testnet; test MON has no monetary value.</li>
          <li>Three trusted validators; collusion and Sybil resistance are not solved.</li>
          <li>One contribution per task; no dispute process.</li>
          <li>Off-chain storage is local to a browser unless a shared database is added.</li>
          <li>Demand and the 8% price point still need customer validation.</li>
        </ul>
      </section>
    </div>
  );
}
