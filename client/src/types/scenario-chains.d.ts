// scripts/scenario-chains.mjs(단일 소스)를 src에서 타입과 함께 쓰기 위한 선언
declare module "*scenario-chains.mjs" {
  export interface ScenarioChainStep {
    to: string;
    label: string;
    why: string;
  }

  export interface ScenarioChain {
    slug: string;
    route: string;
    name: string;
    heading: string;
    seoTitle: string;
    seoDescription: string;
    intro: string;
    steps: ScenarioChainStep[];
    related: string[];
  }

  export const SCENARIO_CHAINS: ScenarioChain[];
  export const SCENARIO_CHAIN_ROUTES: readonly string[];
  export function getScenarioChain(route: string): ScenarioChain | null;
  export function getScenarioChainBySlug(slug: string): ScenarioChain | null;
  export function buildScenarioChainHtml(route: string): string | null;
}
