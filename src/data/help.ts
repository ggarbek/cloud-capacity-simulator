/**
 * Help content — Getting started · Concepts · FAQ (v2.23).
 *
 * Curated, static, high-level copy for the Getting Started page. It explains
 * WHAT the dashboard does and WHY each concept matters — deliberately NOT how
 * the engine works internally (no packing algorithm, tier cascade, or
 * thresholds). Keep additions at the same altitude.
 */

export type HelpBlock =
  | { kind: 'para'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'note'; text: string };

export interface StartStep {
  n: number;
  title: string;
  body: string;
}

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

// ── Getting started — the workflow, in order ──────────────────────────────
export const GETTING_STARTED_STEPS: StartStep[] = [
  {
    n: 0,
    title: 'See it work first',
    body: 'Load the worked demo for a finished, populated result, or use Quick start to stand up your own fleet in a single form — server, region, zones, and demand — then run it. Everything below is the manual path.',
  },
  {
    n: 1,
    title: 'Cluster builder — define your servers',
    body: 'Describe the server types your fleet runs on: memory, cores, nodes per rack, network, and cost. Start from a ready-made template and edit. These are the building blocks everything else places and packs onto.',
  },
  {
    n: 2,
    title: 'VM fungibility — set the routing policy',
    body: 'Decide which VM families may land on which hardware, and in what order: a Home tier and one or more Spillover tiers. This is what lets demand flow across mixed hardware instead of being stuck on one server type.',
  },
  {
    n: 3,
    title: 'Fleet builder — place the racks',
    body: 'Put racks of those servers into regions and availability zones. This is the physical shape of your fleet — how much capacity sits where.',
  },
  {
    n: 4,
    title: 'VM demand — build the Bill of Materials',
    body: 'List the VMs you want to deploy: which sizes, how many, and where — spread across a region or pinned to specific zones for resilience.',
  },
  {
    n: 5,
    title: 'Run the simulation',
    body: 'Use the Run button in the top bar to pack the demand onto the fleet. The run is the payoff — it lands you on the Results.',
  },
  {
    n: 6,
    title: 'Read the results',
    body: 'Overview answers the key questions at a glance. Fleet map shows the racks server by server. Scenario analysis tests what else could pack onto the fleet on top of what you ran.',
  },
];

// ── Concepts — the "library" ──────────────────────────────────────────────
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
