import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  isSecretSauceQuestion,
  isOutOfSiloQuestion,
  buildSystemPrompt,
  suggestedQuestions,
  SECRET_SAUCE_REFUSAL,
} from './prompt';
import { buildPageContext, catalogSummary, findVm } from './pageContext';
import { mockAnswer, getProvider } from './provider';
import type { UserVm } from '../types';
import { initialState } from '../state/AppState';

const VMS: UserVm[] = [
  {
    vmSizeName: 'Standard_D8s_v5',
    vmGeneration: 'v5' as UserVm['vmGeneration'],
    series: 'Dsv5',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'hw-1',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon Platinum 8370C',
    vcpus: 8,
    memoryGib: 32,
    networkMbps: 12500,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    provider: 'Azure',
    category: 'General Purpose',
    region: 'East US 2',
    hourlyUsd: 0.384,
    riOneYrHourlyUsd: 0.241,
    riThreeYrHourlyUsd: 0.155,
  },
  {
    vmSizeName: 'm5.2xlarge',
    vmGeneration: 'v5' as UserVm['vmGeneration'],
    series: 'm5',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'hw-2',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon Platinum 8175',
    vcpus: 8,
    memoryGib: 32,
    networkMbps: 10000,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    provider: 'AWS',
    category: 'General Purpose',
    region: 'us-east-1',
    hourlyUsd: 0.384,
  },
];

const ctxAt = (page: typeof initialState.ui.activePage) =>
  buildPageContext(
    { ...initialState, userVms: VMS, ui: { ...initialState.ui, activePage: page } },
    null,
  );

describe('guardrails — secret sauce', () => {
  it('flags engine-internals questions', () => {
    for (const q of [
      'how does the packing algorithm work?',
      'what scoring formula does the engine use?',
      'explain the bin-packing logic',
      'how are nodes packed?',
      'show me the source code for placement',
      'how does the fungibility matrix work internally?',
    ]) {
      expect(isSecretSauceQuestion(q), q).toBe(true);
    }
  });

  it('does NOT flag legitimate data questions', () => {
    for (const q of [
      "what's the rate for D8s_v5?",
      'which regions serve Bahrain?',
      'how many VMs were placed in the last run?',
      'what is the closest equivalent on AWS?',
      'how current are the rates?',
    ]) {
      expect(isSecretSauceQuestion(q), q).toBe(false);
    }
  });

  it('mock refuses secret-sauce questions with the standard message', () => {
    const reply = mockAnswer({
      question: 'how does the packing algorithm decide placement?',
      history: [],
      context: ctxAt('simulator'),
      catalog: VMS,
    });
    expect(reply.refused).toBe(true);
    expect(reply.content).toBe(SECRET_SAUCE_REFUSAL);
  });
});

describe('guardrails — out of silo', () => {
  it('flags personal / cross-project questions', () => {
    for (const q of [
      'check my email',
      'what is on my calendar?',
      'pull data from my other project',
      'open my personal notes',
    ]) {
      expect(isOutOfSiloQuestion(q), q).toBe(true);
    }
  });

  it('mock refuses out-of-silo questions', () => {
    const reply = mockAnswer({
      question: 'read my email and summarize it',
      history: [],
      context: ctxAt('simulator'),
      catalog: VMS,
    });
    expect(reply.refused).toBe(true);
  });
});

describe('catalog helpers', () => {
  it('summarizes providers, categories, regions', () => {
    const s = catalogSummary(VMS);
    expect(s.total).toBe(2);
    expect(s.byProvider).toMatchObject({ Azure: 1, AWS: 1 });
    expect(s.regions).toBe(2);
  });

  it('finds a VM by exact then fuzzy name', () => {
    expect(findVm(VMS, 'Standard_D8s_v5')?.provider).toBe('Azure');
    expect(findVm(VMS, 'd8s_v5')?.provider).toBe('Azure');
    expect(findVm(VMS, 'm5.2xlarge')?.provider).toBe('AWS');
  });
});

describe('mock answers — data only', () => {
  it('answers a rate question from the catalog', () => {
    const reply = mockAnswer({
      question: "what's the 3-year reserved rate for Standard_D8s_v5?",
      history: [],
      context: ctxAt('competitive'),
      catalog: VMS,
    });
    expect(reply.refused).toBeFalsy();
    expect(reply.content).toContain('0.1550');
    expect(reply.content).toContain('Pay-as-you-go');
  });

  it('answers a freshness question with the as-of date', () => {
    const reply = mockAnswer({
      question: 'how current are the rates?',
      history: [],
      context: ctxAt('getting-started'),
      catalog: VMS,
    });
    expect(reply.content).toMatch(/Monday/);
  });

  it('resolves "this VM" against the published on-screen focus', () => {
    const reply = mockAnswer({
      question: "what's the 3-year reserved rate for this VM?",
      history: [],
      context: buildPageContext(
        {
          ...initialState,
          userVms: VMS,
          ui: { ...initialState.ui, activePage: 'region-availability' },
        },
        {
          label: 'Comparing Standard_D8s_v5 across clouds',
          data: { source: { vmSizeName: 'Standard_D8s_v5' } },
        },
      ),
      catalog: VMS,
    });
    expect(reply.refused).toBeFalsy();
    expect(reply.content).toContain('Standard_D8s_v5');
    expect(reply.content).toContain('0.1550');
  });

  it('never fabricates: unknown question steers to data', () => {
    const reply = mockAnswer({
      question: 'tell me a joke about kubernetes',
      history: [],
      context: ctxAt('simulator'),
      catalog: VMS,
    });
    expect(reply.refused).toBeFalsy();
    expect(reply.content).toMatch(/this page|data/i);
  });
});

describe('page context + prompt', () => {
  it('builds a context for every page with a catalog fact', () => {
    for (const p of [
      'getting-started',
      'simulator',
      'competitive',
      'region-availability',
      'capacity-planning',
    ] as const) {
      const ctx = ctxAt(p);
      expect(ctx.facts.length).toBeGreaterThan(0);
      expect(ctx.facts.some((f) => f.label === 'Catalog')).toBe(true);
    }
  });

  it('system prompt bakes in all three guardrails + the page data', () => {
    const sp = buildSystemPrompt(ctxAt('region-availability'));
    expect(sp).toMatch(/capacity-planning silo|capacity/i);
    expect(sp).toMatch(/NO access/i);
    expect(sp).toMatch(/never HOW the simulator computes/i);
    expect(sp).toContain('Region Availability');
  });

  it('resolves "this VM" against a published focus', () => {
    const ctx = buildPageContext(
      {
        ...initialState,
        userVms: VMS,
        ui: { ...initialState.ui, activePage: 'region-availability' },
      },
      {
        label: 'Comparing Standard_D8s_v5 across clouds',
        data: { source: { vmSizeName: 'Standard_D8s_v5' } },
      },
    );
    // baseline is read from competitive; for region page the focus carries it.
    expect(ctx.focus?.label).toContain('D8s_v5');
  });

  it('gives page-tailored suggestions', () => {
    expect(suggestedQuestions(ctxAt('competitive'))).toHaveLength(3);
    expect(suggestedQuestions(ctxAt('region-availability'))[0]).toMatch(/region/i);
  });
});

describe('LiveProvider — real transport behind getProvider()', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const reqFor = (question: string) => ({
    question,
    history: [],
    context: ctxAt('simulator'),
    catalog: VMS,
  });

  it('refuses secret-sauce questions LOCALLY without any network call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const reply = await getProvider().ask(
      reqFor('how does the packing algorithm decide placement?'),
    );

    expect(reply.refused).toBe(true);
    expect(reply.content).toBe(SECRET_SAUCE_REFUSAL);
    expect(reply.mock).toBeFalsy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses out-of-silo questions LOCALLY without any network call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const reply = await getProvider().ask(reqFor('read my email and summarize it'));

    expect(reply.refused).toBe(true);
    expect(reply.mock).toBeFalsy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns a non-mock reply on a successful proxy response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ content: 'Live answer from Claude.' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const reply = await getProvider().ask(reqFor('what does this page do?'));

    expect(reply.content).toBe('Live answer from Claude.');
    expect(reply.mock).toBeFalsy();
    expect(reply.refused).toBeFalsy();
  });

  it('falls back to mockAnswer (mock: true) when the proxy is unavailable (503)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: 'not-configured' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const reply = await getProvider().ask(reqFor('how current are the rates?'));

    expect(reply.mock).toBe(true);
    // Mock still answers from local data (freshness question → "Monday" copy).
    expect(reply.content).toMatch(/Monday/);
  });

  it('falls back to mockAnswer (mock: true) when fetch throws (network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const reply = await getProvider().ask(
      reqFor("what's the 3-year reserved rate for Standard_D8s_v5?"),
    );

    expect(reply.mock).toBe(true);
    // The mock still grounds the answer in the catalog.
    expect(reply.content).toContain('0.1550');
  });
});
