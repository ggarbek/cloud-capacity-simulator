/**
 * Help content — Start Here · Concepts · FAQ (v2.23 → S68).
 *
 * Curated, static, high-level copy for the Start Here pages and the Glossary. It explains
 * WHAT the dashboard does and WHY each concept matters — deliberately NOT how
 * the engine works internally (no packing algorithm, tier cascade, or
 * thresholds). Keep additions at the same altitude.
 */

export type HelpBlock =
  | { kind: 'para'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'note'; text: string };

export interface Concept {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  body: HelpBlock[];
}

export interface Faq {
  q: string;
  a: string[];
  /** Optional compact table rendered after the answer paragraphs. */
  table?: { caption?: string; headers: string[]; rows: string[][] };
}

export const CONCEPTS: Concept[] = [
  {
    id: 'fleet-clusters',
    title: 'Fleet & clusters',
    summary: 'Your whole footprint, and the groups of identical racks it is made of.',
    tags: ['fleet', 'cluster', 'capacity'],
    body: [
      { kind: 'para', text: 'A fleet is your entire hardware footprint. A cluster is one group of identical racks of a single server type, sitting in a particular region and availability zone.' },
      { kind: 'para', text: 'Capacity, cost, and revenue all roll up from clusters — so the fleet view is just the sum of its clusters, and you can drill into any one of them.' },
    ],
  },
  {
    id: 'hardware-nodes-racks',
    title: 'Hardware, nodes & racks',
    summary: 'A node is one server; a rack holds several; VMs pack onto nodes.',
    tags: ['hardware', 'node', 'rack', 'server'],
    body: [
      { kind: 'para', text: 'A node is a single server with a fixed amount of memory, vCPU, network, and storage throughput. A rack holds several nodes. You buy capacity by the rack.' },
      { kind: 'para', text: 'When the simulator runs, each VM is placed onto a node that has room for it. How densely VMs pack onto nodes is what determines how much of your hardware is actually earning.' },
    ],
  },
  {
    id: 'vm-demand',
    title: 'VM demand (Bill of Materials)',
    summary: 'The list of VMs you want to deploy — size, quantity, and placement.',
    tags: ['demand', 'bom', 'vm'],
    body: [
      { kind: 'para', text: 'The Bill of Materials is the workload: which VM sizes you want, how many of each, and where they should land.' },
      { kind: 'para', text: 'Each line also carries a region and a deployment style — spread across a region, or pinned to specific availability zones. The simulator packs this demand onto the fleet you built.' },
    ],
  },
  {
    id: 'fungibility',
    title: 'Fungibility — Home vs Spillover',
    summary: 'Which hardware a VM family prefers, and where it overflows when that is full.',
    tags: ['fungibility', 'home', 'spillover', 'routing'],
    body: [
      { kind: 'para', text: 'Fungibility is the routing policy for your fleet. For each VM family you pick a Home: the hardware it should land on first. You can then add Spillover tiers — the hardware it may overflow to, in order, when Home is full.' },
      { kind: 'para', text: 'Real fleets run mixed hardware and let demand flow across it. Fungibility is how you capture that policy, so the simulator places VMs the way your fleet actually would.' },
      { kind: 'note', text: 'A VM with no rule for any of your hardware has nowhere to land — the results will flag it so you can add a Home or Spillover.' },
    ],
  },
  {
    id: 'quick-start-routing',
    title: 'Quick start & automatic routing',
    summary: 'Quick start picks a Home for the VMs you choose, so you get a result without authoring fungibility by hand.',
    tags: ['quick start', 'fungibility', 'home', 'auto-route', 'routing'],
    body: [
      { kind: 'para', text: 'Quick start stands up a whole fleet from a single form — one server type, a region, zones, and the VMs you want to run. Because you pick a single hardware type, every VM you add is automatically given that hardware as its Home: the routing is authored for you, so the fleet runs without a separate trip to the Fungibility tab.' },
      { kind: 'para', text: 'The same automatic routing is available on the Fungibility tab whenever demand has no rule yet — it fills in a sensible Home (and Spillover, once you run mixed hardware) for anything still unrouted. It only ever adds missing routes; any choice you made by hand is left untouched.' },
      { kind: 'note', text: 'One exception: a VM that is physically too large to fit on a single node of that server is not silently routed Home — it is reported as unfittable so you can pick a bigger server or split the demand, rather than authoring a route the fleet could never honor.' },
    ],
  },
  {
    id: 'buffer',
    title: 'Buffer / overhead',
    summary: 'Capacity held back on each cluster for healing and headroom.',
    tags: ['buffer', 'overhead', 'reserve'],
    body: [
      { kind: 'para', text: 'Buffer is the slice of each cluster you deliberately keep empty — for failure recovery, maintenance, and breathing room. It is excluded from packing.' },
      { kind: 'para', text: 'You never deploy to 100%, so the buffer keeps the simulation honest about how much capacity is really sellable.' },
    ],
  },
  {
    id: 'zonal-regional',
    title: 'Zonal vs regional deployment',
    summary: 'Pack wherever there is room, or spread across availability zones for resilience.',
    tags: ['zone', 'region', 'availability', 'ha'],
    body: [
      { kind: 'para', text: 'Regional demand packs into whichever cluster in the region has the most room. Zonal demand is pinned to specific availability zones, or balanced evenly across them.' },
      { kind: 'para', text: 'Spreading a deployment across zones is how you survive a zone outage — so most production demand is zonal.' },
    ],
  },
  {
    id: 'sellable-headroom',
    title: 'Sellable capacity & headroom',
    summary: 'The extra revenue still available by filling the leftover space.',
    tags: ['sellable', 'headroom', 'revenue', 'utilization'],
    body: [
      { kind: 'para', text: 'After your demand is placed, the fleet usually has leftover space. Sellable capacity is what you could still earn by filling it — the gap between revenue today and revenue at full utilization.' },
      { kind: 'para', text: 'It is the money on the table: a high number means you can grow on the hardware you already own.' },
    ],
  },
  {
    id: 'four-questions',
    title: 'The questions the results answer',
    summary: 'Every result leads with the executive read of the fleet.',
    tags: ['overview', 'answers', 'investment'],
    body: [
      { kind: 'para', text: 'The Overview leads with the questions an operator actually asks:' },
      {
        kind: 'list',
        items: [
          'Does this fleet investment make sense, given the demand running on it?',
          'Is the deployment supportable on current capacity?',
          'Where is it blocked, and why?',
          'How much more could you sell on this fleet?',
        ],
      },
      { kind: 'para', text: 'Everything else on the page is the detail behind those answers.' },
    ],
  },
  {
    id: 'scenario-analysis',
    title: 'Scenario analysis',
    summary: 'A what-if on top of a run: build a list of sizes and see how many of each could still pack, and where.',
    tags: ['scenario', 'what-if', 'planning', 'bom'],
    body: [
      { kind: 'para', text: 'Scenario analysis lets you build a small bill of materials on top of the run: add one or more VM sizes (each with an optional quantity) and pick a scope — the whole fleet, a region, a zone, or a single cluster. It then shows how many of each could fit into the leftover capacity of the current run.' },
      { kind: 'para', text: 'The sizes compete for the same spare space, in the order you list them, so each line shows what fits alongside the others — and, when a line asks for more than fits, how many are blocked and why. It is additive: nothing is added to your fleet, and no deployed VM is moved.' },
      { kind: 'note', text: 'This is the groundwork for feeding live fleet data in later, to judge whether a real deployment is feasible before you commit it.' },
    ],
  },
  {
    id: 'fleet-map',
    title: 'Fleet map altitudes',
    summary: 'Three zoom levels — regions, zone aisles, and rack elevations.',
    tags: ['fleet map', 'visualization', 'drill'],
    body: [
      { kind: 'para', text: 'The fleet map shows your fleet at three altitudes: regions at the top, the zone aisles within a region, and the rack elevation — server by server — at the bottom.' },
      { kind: 'para', text: 'Drilling in narrows everything else on the map to that scope, so you can read utilization and financials at the level of detail you need.' },
    ],
  },
  {
    id: 'rate-freshness',
    title: 'VM sizes, rates & how they refresh',
    summary: 'A broad estimated catalog, plus real per-region rates that refresh automatically every week.',
    tags: ['rates', 'pricing', 'refresh', 'live', 'data', 'sizes', 'regions', 'freshness'],
    body: [
      { kind: 'para', text: 'The catalog you browse and filter (the VM Library) ships pre-loaded with public vendor specs and list pricing across every provider, size, and region. It is a broad baseline: most of its pricing is estimated, so you always have something to plan against without fetching anything.' },
      { kind: 'para', text: 'On top of that sits Live rates. Pick a provider and region and press Load, and the simulator pulls the real specs, network, and pricing for that region and swaps them into the catalog in place of the estimates. Loading works for AWS, Azure, and GCP.' },
      { kind: 'heading', text: 'How current the live rates are' },
      { kind: 'para', text: 'The live rate data refreshes automatically every Monday at 07:00 UTC for all regions across AWS, Azure, and GCP. This runs in the cloud on a schedule — it does not depend on anyone having the app or any tool open, and the website picks up the new rates on its own once they publish.' },
      { kind: 'para', text: 'The Live rates panel shows when the data was last refreshed and when the next scheduled refresh will run, so you always know how fresh the numbers are.' },
      { kind: 'note', text: 'The broad estimated catalog is the always-available baseline and is not itself rewritten weekly; the weekly job refreshes the real per-region rates (and the Azure M-series rates baked into the catalog). A region shows its real, current rates once you Load it.' },
    ],
  },
  {
    id: 'pricing-basis',
    title: 'Pricing basis (PAYG / RI)',
    summary: 'Read every dollar at on-demand or reserved-instance rates.',
    tags: ['pricing', 'payg', 'reserved', 'cost'],
    body: [
      { kind: 'para', text: 'Every revenue figure can be shown at pay-as-you-go (PAYG) rates or at 1-year and 3-year reserved-instance equivalents.' },
      { kind: 'para', text: 'The switch lets you compare the upside of on-demand pricing against the discount of committed capacity.' },
    ],
  },
];

// ── FAQ ───────────────────────────────────────────────────────────────────
export const FAQS: Faq[] = [
  {
    q: 'Do I need to author fungibility rules?',
    a: [
      'For a single hardware type, the defaults are enough to get a result.',
      'With mixed hardware, fungibility is how you tell the simulator which VMs may land where and in what order. The VM fungibility tab makes this a quick drag-and-drop.',
    ],
  },
  {
    q: 'How does Quick start handle fungibility?',
    a: [
      'Quick start uses a single hardware type, so every VM you add is automatically routed to it as its Home — you get a result without authoring any rules by hand.',
      'A VM that is too large to fit on one node of that server is flagged as unfittable instead of being routed there, so pick a bigger server or split that demand.',
    ],
  },
  {
    q: 'What does "spillover" mean?',
    a: [
      "When a VM's preferred (Home) hardware is full, it overflows to the next hardware you allowed.",
      'Spillover shown in the results is informational — the fleet working as designed, not an error.',
    ],
  },
  {
    q: 'Why is a VM blocked?',
    a: [
      'Usually one of three reasons: it is too big to fit on any node, there is no fungibility rule routing it to your hardware, or the capacity it needs is already full.',
      'The results name the specific reason for each blocked VM so you know whether to add a rule or add hardware.',
    ],
  },
  {
    q: 'What is the difference between Overview and Scenario analysis?',
    a: [
      'Overview reports on the run you just packed — what fit, what is blocked, and the financials.',
      'Scenario analysis is a what-if layered on top: how many more of a chosen size could still fit, where, and what would be blocked.',
    ],
  },
  {
    q: 'How current are the VM sizes and rates, and how do they refresh?',
    a: [
      'There are two layers. The VM Library you browse is a broad, pre-loaded catalog covering every provider, size, and region — its pricing is mostly estimated, so you always have a baseline to plan against. The Live rates panel sits on top: pick a provider and region, press Load, and it swaps in the real specs, network, and pricing for that region. Loading works for AWS, Azure, and GCP.',
      'The live rate data refreshes automatically every Monday at 07:00 UTC, for all regions across all three providers. That job runs in the cloud on a schedule — it does not depend on anyone having the app or any tool open, and the website picks up the new rates on its own once they publish.',
      'The Live rates panel shows the date of the last refresh and the next scheduled refresh, so you can always see how fresh the numbers are. A given region shows its real, current rates once you Load it; until then you are seeing the broad estimate.',
    ],
  },
  {
    q: 'Why are some reserved (1yr / 3yr RI) rates missing, and what is an “estimated” rate?',
    a: [
      'Every region shows pay-as-you-go (PAYG) pricing, but some sizes have no published 1-year or 3-year reserved rate. That is not a loading gap — the cloud genuinely does not sell a reservation for that exact size-and-region. It happens for AWS edge zones (Local Zones / Wavelength are on-demand only) and brand-new instance families that have no classic reserved pricing yet, and for Azure Basic-tier VMs (which can’t be reserved by design), constrained-vCPU variants (you reserve the parent size instead), and the newest generations before reservations roll out. The weekly refresh picks these up automatically the moment the clouds publish them.',
      'By default an unavailable reserved rate shows as “—”. In the VM Catalog you can opt in to an estimate: turn on “Estimate … where the cloud publishes no reserved rate” under the pricing-basis selector. An estimate is PAYG × the provider’s typical reservation discount, and the value is always badged “est.” with a ~ so it’s never mistaken for real pricing. The discount factors aren’t guessed — they’re the measured median of (reserved ÷ PAYG) across every size that does publish both rates:',
    ],
    table: {
      caption: 'Typical reserved discount (share of PAYG) — measured 2026-06-22',
      headers: ['Cloud', '1yr RI', '3yr RI'],
      rows: [
        ['AWS', '≈ 63%', '≈ 43%'],
        ['Azure', '≈ 59%', '≈ 38%'],
        ['GCP', '≈ 63%', '≈ 45%'],
      ],
    },
  },
  {
    q: 'Is my data uploaded anywhere?',
    a: [
      'No. Everything runs in your browser.',
      'Public vendor specs and list pricing ship pre-loaded. Anything you add — your fleets, demand, and rules — stays local and is only saved in your browser unless you export it from Save / Load.',
    ],
  },
  {
    q: 'How do I start over or load an example?',
    a: [
      'Use Save / Load in the top bar to export or import a snapshot, or load the worked demo.',
      'Quick start stands up a fresh fleet from a single form if you want to begin from scratch.',
    ],
  },
];

// ── Start here — the front door for each half of the suite ────────────────
//
// A first-time visitor lands here, not on an authoring form. The altitude is
// the public README's: what question this half answers, what it does, what
// each page in the rail is for, and a one-click path to a populated result.
// Deliberately shallow — the depth lives in CONCEPTS and the CMA FAQ.

export interface StartHerePageRow {
  /** Nav label, verbatim as it appears in the rail. */
  label: string;
  /** What that page answers, in one line. */
  answers: string;
}

/**
 * Where a bullet sends a reader who wants the depth behind it.
 *
 * `target` is resolved by the surface that renders it, because the two halves
 * of the suite keep their depth in different places: on the simulator it is a
 * `CONCEPTS` id (opened in the Glossary), on Cloud Market Analytics it is a
 * section id in the FAQ & Glossary page.
 */
export interface StartHereLink {
  /** Link text, written as the thing you will learn — not "learn more". */
  label: string;
  /** Simulator: a `CONCEPTS` id. CMA: a FAQ & Glossary section id. */
  target: string;
}

/**
 * One Start Here bullet, in the house style: a short bold topic phrase that
 * carries the takeaway on its own, then the explanation behind it. A reader
 * skimming only the leads should still come away with the argument.
 */
export interface StartHereBullet {
  /** The takeaway, rendered bold. A statement, never a label. */
  lead: string;
  /** The explanation that earns the lead. */
  body: string;
  /** Optional pointer to the fuller account. Not every bullet needs one. */
  learnMore?: StartHereLink;
}

export interface StartHereContent {
  /** The question this half of the suite exists to answer. */
  question: string;
  /** Two or three sentences of framing, README register. */
  lede: string;
  /** Why a planner would care, before what the tool is. Mirrors the README's
   *  "The problem this solves" — the two expensive failure directions, plus
   *  the quieter third one this refuses to commit. */
  problem: StartHereBullet[];
  /** The named answers this half produces, in the README's register: name the
   *  answer, then say what it contains. A reader should be able to scan the
   *  leads alone and know whether this tool is for them. */
  answers: StartHereBullet[];
  /** The standing assumptions behind every number this half produces. Stated
   *  on the front page rather than buried, because a capacity answer read
   *  without its assumptions is worse than no answer. Planner language. */
  assumptions: StartHereBullet[];
  /** One line under the four answers. The simulator produces a fifth thing it
   *  cannot itself resolve — the demand that did not fit — and that hand-off
   *  is a simulator output, not a Cloud Market Analytics feature. */
  answersFootnote: string;
  /** Answered at the moment the reader decides whether to try it with real
   *  data: how their fleet gets in, and where it goes. Kept to one sentence —
   *  the mechanics belong in the demo and the FAQ, not the front door. */
  dataNote: string;
  /** Map of the rail: the gap the README never fills. */
  pages: StartHerePageRow[];
  /** Why the numbers can be trusted — condensed from the README's "It refuses
   *  to state a number it can't defend". Three points, no code identifiers. */
  honesty: StartHereBullet[];
  /** Primary CTA — loads the worked demo and lands on a populated result. */
  demoCta: string;
  demoSub: string;
  /** Secondary CTA — author your own. */
  buildCta: string;
  buildSub: string;
}

/**
 * Project status — rendered at the top of BOTH Start Here pages.
 *
 * One constant, deliberately: the two halves must never drift into claiming
 * different levels of maturity. Reads as a statement of scope, not an apology.
 */
export const PROJECT_STATUS =
  'Proof of concept, actively being built — not production-ready, and not in use anywhere. ' +
  'Read the numbers as a demonstration of method.';

/**
 * Which half does this reader need?
 *
 * The two halves answer adjacent questions and are easy to confuse, so the
 * distinction is defined ONCE and rendered identically on both Start Here
 * pages.
 *
 * The dividing line is SCOPE, not ownership. The simulator reasons about one
 * concrete fleet against one concrete deployment; Cloud Market Analytics
 * reasons about the published market across providers. Ownership is the wrong
 * axis — the fleet being modelled is often one the operator sells capacity
 * from rather than rents, and the market view is as useful for benchmarking
 * your own offering as for shopping. Never let the two pages describe this
 * differently.
 */
export const TOOL_SPLIT: Record<'simulator' | 'cma', { title: string; when: string }> = {
  simulator: {
    title: 'Capacity Simulator — one fleet, one deployment',
    when:
      'Use it when the question is about specific hardware and specific demand: will this land, which resource stops it, how much capacity is left over, and what the economics look like.',
  },
  cma: {
    title: 'Cloud Market Analytics — the published market',
    when:
      'Use it when the question is about how the clouds compare: the closest equivalent for a VM size or a whole demand, how the specifications differ, the cost delta, and where the market has a gap.',
  },
};

export const START_HERE: Record<'simulator' | 'cma', StartHereContent> = {
  simulator: {
    question:
      'Will this deployment actually land on this fleet — and if not, which resource is stopping it?',
    lede:
      'Not “do we have enough memory,” and not “what is our average utilization.” The real question is whether every VM in a committed bill of materials finds a node where memory, vCPU, network bandwidth and storage throughput all clear at the same time — and when one does not, exactly which of those four blocked it, on which node, by how much.',
    problem: [
      {
        lead: 'The binding constraint identified, not averaged away:',
        body:
          'Memory, vCPU, network bandwidth and storage throughput deplete at different rates, and the first to run short caps the fleet regardless of what the other three still show. A utilisation average reports a cluster half empty while it cannot accept another VM.',
      },
      {
        lead: 'Feasibility established before the commitment is made:',
        body:
          'A bill of materials is agreed with a date attached. Whether it lands is normally discovered afterwards, once the inexpensive ways to correct it are gone.',
      },
      {
        lead: 'Shortfall and excess capacity priced in the same run:',
        body:
          'Neither is visible until a specific deployment is tested against a specific fleet, and both cost money every month they go unnoticed — one as demand that cannot be served, the other as hardware depreciating unused.',
      },
    ],
    answers: [
      {
        lead: 'Does this fleet investment make sense?',
        body:
          'What the fleet costs to run against what it earns — depreciation and operating cost, gross margin against the target you set, and whether payback lands inside the usable life of the hardware rather than after it retires.',
        learnMore: { label: 'Pricing basis (PAYG / RI)', target: 'pricing-basis' },
      },
      {
        lead: 'Is this deployment supportable on current capacity?',
        body:
          'Whether every VM in the committed demand finds a node, at what utilisation, and with how much capacity left stranded.',
      },
      {
        lead: 'Where are we blocked, and why?',
        body:
          'For every VM that fails to place: which of the four constraints stopped it, on which node, and by how much — including the difference between "this cluster cannot take it" and "no node anywhere ever could", because those are different decisions.',
        learnMore: { label: 'Hardware, nodes & racks', target: 'hardware-nodes-racks' },
      },
      {
        lead: 'How much more can we sell on this fleet?',
        body:
          'A defensible ceiling on the capacity still unused — what else would fit alongside what is already running, and what it would be worth.',
        learnMore: { label: 'Sellable capacity & headroom', target: 'sellable-headroom' },
      },
    ],
    assumptions: [
      {
        lead: 'Placement is permissioned, not automatic:',
        body: 'Fungibility rules decide which VM families may occupy which hardware and in what order — a preferred home first, then spillover. A family with no rule does not place at all, however much room the fleet has.',
        learnMore: { label: 'Fungibility — Home vs Spillover', target: 'fungibility' },
      },
      {
        lead: 'A node must clear all four dimensions at once:',
        body: 'Memory, vCPU, network bandwidth and storage throughput are tested together, and whichever runs out first is the binding constraint — so what governs is the highest utilisation of the four, never the average. A cluster sitting at 55% memory can still be unable to accept a single VM.',
      },
      {
        lead: 'Large VMs are placed first, into the tightest fit:',
        body: 'A VM that cannot be placed is recorded with its reason and the run carries on, so one oversized request never hides the rest of the answer.',
      },
      {
        lead: 'Very-high-memory classes take a full node each:',
        body: 'They are treated as isolated — one VM per node, with nothing packed alongside them.',
      },
      {
        lead: 'Buffer is withheld before packing starts:',
        body: 'A flat percentage or a fixed node count comes off each cluster first, so headroom is never counted as capacity you could sell.',
        learnMore: { label: 'Buffer / overhead', target: 'buffer' },
      },
      {
        lead: 'Stranded capacity is counted only on occupied nodes:',
        body: 'Leftover room is reported on nodes already holding a VM. Empty and reserved nodes are left out, so the figure means space trapped beside live workloads rather than hardware you simply have not filled yet.',
        learnMore: { label: 'Sellable capacity & headroom', target: 'sellable-headroom' },
      },
      {
        lead: 'Costs are list price and straight-line depreciation:',
        body: 'Capex is written down evenly across the usable life you set. Negotiated discounts and your own amortisation schedule are not modelled, and either would move the result.',
        learnMore: { label: 'Pricing basis (PAYG / RI)', target: 'pricing-basis' },
      },
    ],
    answersFootnote:
      'Whatever could not be placed is, in effect, a shortlist of work that has to run somewhere else. Deciding that is this side of the tool; comparing where it could go is the other.',
    dataNote:
      'Your fleet, VM catalog and demand can be typed in or loaded from a spreadsheet. Everything runs in your browser: no account, and nothing you load is uploaded anywhere.',
    pages: [
      { label: 'Quick Start', answers: 'Stand up a whole fleet from one form, then run it.' },
      { label: 'Cluster Builder', answers: 'Define the server types your fleet runs on.' },
      { label: 'VM Fungibility', answers: 'Which VM families may land on which hardware, and in what order.' },
      { label: 'Fleet Builder', answers: 'Place racks into regions and availability zones.' },
      { label: 'VM Demand', answers: 'The bill of materials — which VMs, how many, and where.' },
      { label: 'Run Results', answers: 'The four questions answered in plain English, investment first.' },
      { label: 'Fleet Map', answers: 'The rack picture, with per-node and per-zone drill-down.' },
      { label: 'Scenario Analysis', answers: 'What else would fit on the fleet as it stands today.' },
      { label: 'VM Catalog', answers: 'The VM sizes available to place, and their published specs and rates.' },
      { label: 'FAQ & Glossary', answers: 'Every concept the tool uses, plus the common questions.' },
    ],
    honesty: [
      {
        lead: 'Unpublished values stay empty:',
        body: 'Nothing is interpolated to fill a gap, and a dash never silently means zero.',
      },
      {
        lead: 'Headroom is a menu, never a sum:',
        body:
          'The sizes that would fit the spare capacity compete for the same nodes, so they are listed as alternatives and never added together. Totalling them would invent capacity the fleet does not have.',
        learnMore: { label: 'Sellable capacity & headroom', target: 'sellable-headroom' },
      },
      {
        lead: 'No number the inputs cannot support:',
        body:
          'Where a rate, a specification or a cost is missing, the result says so and names what is missing rather than producing a confident figure out of a gap.',
      },
    ],
    demoCta: 'See it work',
    demoSub: 'Loads a worked fleet and jumps straight to the results. Nothing to fill in.',
    buildCta: 'Build your own',
    buildSub: 'Start from a single form in Quick Start.',
  },
  cma: {
    question:
      'What are the closest VM equivalents across clouds, how do they compare, what are the cost deltas, and where are the market gaps?',
    lede:
      'Cross-cloud VM comparison on published data, for a single size or an entire bill of materials. Four outputs: the nearest real equivalent on each cloud, how it differs in specification, what it costs across commitment terms, and where the market has a gap no provider fills.',
    problem: [
      {
        lead: 'Cross-cloud equivalents computed, not looked up:',
        body:
          'No vendor publishes a mapping between an Azure size, an AWS instance and a GCP machine type. Establishing the equivalent is the prerequisite for any comparison, and it is the one input no provider has an incentive to produce.',
      },
      {
        lead: 'Comparisons that hold up against the workload:',
        body:
          'Two sizes with identical core and memory counts can differ in CPU architecture, memory-to-core ratio, local storage and network ceiling — the characteristics that determine whether the workload performs, none of which appear in the two figures most often quoted.',
      },
      {
        lead: 'Availability enforced before price:',
        body:
          'A provider that does not offer the equivalent in the regions the workload is bound to is not a cheaper option. Comparisons that omit coverage produce savings against alternatives that were never available.',
      },
      {
        lead: 'Market gaps surfaced as findings:',
        body:
          'Where no provider offers an acceptable equivalent — for a category, a size class or an entire metro — that absence is a planning input in its own right, and it cannot be observed from inside a single vendor catalog.',
      },
    ],
    answers: [
      {
        lead: 'The closest equivalent on each cloud:',
        body:
          'For one VM size or an entire bill of materials, the nearest real size each provider offers — derived from published specifications rather than a hand-kept mapping, so it stays correct as new SKUs ship.',
        learnMore: { label: 'How matching works', target: 'similarity' },
      },
      {
        lead: 'Every specification difference, quantified:',
        body:
          'Where the equivalent differs and by how much — vCPU, memory, memory per vCPU, CPU architecture, local storage, network — as a similarity percentage, with a named caveat whenever the match is not a true peer.',
        learnMore: { label: 'Reading the numbers', target: 'markers' },
      },
      {
        lead: 'The cost delta across commitment terms:',
        body:
          'What the equivalent costs against what runs today, on pay-as-you-go and on one- and three-year commitments, per region and over time.',
        learnMore: { label: 'How pricing is calculated', target: 'pricing' },
      },
      {
        lead: 'The gaps no provider fills:',
        body:
          'A metro one cloud does not reach, a category with no peer, a line of demand nothing matches. Reported as a result rather than dropped from a total.',
        learnMore: { label: 'How region availability works', target: 'region' },
      },
    ],
    assumptions: [
      {
        lead: 'Matching is computed from catalog specifications:',
        body: 'Two sizes must first sit in the same product category — memory-optimised only ever matches memory-optimised — and within that gate the closest size wins on vCPU count, memory, and memory per vCPU, with the same CPU architecture and matching accelerators preferred. Because nothing is asserted from a hand-kept table, matches stay correct as new SKUs ship.',
        learnMore: { label: 'How matching works', target: 'similarity' },
      },
      {
        lead: 'A match is scored, not declared:',
        body: 'Whatever difference remains is blended into one similarity percentage, measured proportionally — a 4-vs-8 vCPU gap counts the same as 64 vs 128 — and anything short of a true peer carries a named caveat. Read the percentage as a distance, not a guarantee.',
        learnMore: { label: 'How matching works', target: 'similarity' },
      },
      {
        lead: 'Prices are public list rates:',
        body: 'Enterprise agreements, committed-use discounts and private pricing are not modelled, and any of them would move every number here.',
        learnMore: { label: 'How pricing is calculated', target: 'pricing' },
      },
      {
        lead: 'Region equivalency is a distance rule, not a vendor mapping:',
        body: 'Two regions line up on the same row when they are in the same country, share the same sovereign or commercial class, and sit within 400 km of each other by great-circle distance. Country leads because data residency usually binds harder than latency. Grouping is by proximity rather than by matching city names, which is why AWS us-west-2 and GCP us-west1 — roughly 180 km apart in Oregon — correctly land together.',
        learnMore: { label: 'How region equivalency works', target: 'region' },
      },
      {
        lead: 'Every rate carries the date it was pulled:',
        body: 'When a refresh has gone stale it is shown as stale, rather than quietly served as current.',
        learnMore: { label: 'Where the data comes from', target: 'data' },
      },
    ],
    answersFootnote:
      'One common way in is from the simulator: whatever it could not place is a list of workloads to price here. Nothing requires that route, though — the comparison stands on its own.',
    dataNote:
      'Vendor specs and list rates ship pre-loaded and dated. Your own equivalencies and demand can be loaded from a spreadsheet, and everything runs in your browser: no account, nothing uploaded.',
    pages: [
      { label: 'Comparison Setup', answers: 'Set the base cloud and pick what to compare. Drives every other page.' },
      { label: 'Executive Summary', answers: 'The verdict first — cheapest viable target, the delta, the gaps.' },
      { label: 'Specs', answers: 'Side-by-side hardware, with the match percentage and what differs.' },
      { label: 'Pricing', answers: 'Cost over time, and an estimator you can put your own quantities into.' },
      { label: 'Region Availability', answers: 'Where each cloud offers it — and where nobody does.' },
      { label: 'Rate Library', answers: 'The per-region rate card behind every number above.' },
      { label: 'FAQ & Glossary', answers: 'How matching, similarity and region equivalency actually work.' },
    ],
    honesty: [
      {
        lead: 'Unpublished values stay empty:',
        body: 'Nothing is interpolated to fill a gap, and a dash never silently means zero.',
      },
      {
        lead: 'Estimates labelled wherever they appear:',
        body:
          'The markers survive into the exported deck as footnotes, because caveats that live only in the app and vanish in the slide are the ones that get someone burned in a review.',
      },
      {
        lead: 'Savings claimed only when both sides are fully priced:',
        body:
          'If either side carries an unmatched or unpriced line, no saving is stated and the incomplete side is named. A favourable answer gets the same scrutiny as an unfavourable one.',
      },
    ],
    demoCta: 'See it work',
    demoSub: 'Loads a worked comparison and jumps straight to the executive summary.',
    buildCta: 'Set up your own',
    buildSub: 'Pick a base cloud and a VM in Comparison Setup.',
  },
};
