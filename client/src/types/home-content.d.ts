// scripts/home-content.mjs(단일 소스)를 src에서 타입과 함께 쓰기 위한 선언
declare module "*home-content.mjs" {
  export interface HomeSection {
    id: string;
    h2: string;
    body: string;
  }

  export interface HomeHubItem {
    to: string;
    label: string;
    desc: string;
  }

  export interface HomeHubGroup {
    id: string;
    icon: string;
    title: string;
    items: HomeHubItem[];
  }

  export interface HomeLink {
    path: string;
    label: string;
  }

  export const HOME_H1: string;
  export const HOME_INTRO: string;
  export const HOME_DESCRIPTION: string;
  export const HOME_SECTIONS: HomeSection[];
  export const HOME_GUIDE_H2: string;
  export const HOME_LINKS_H2: string;
  export const HOME_LINKS_AFTER_SECTION: number;
  export const HOME_HUB_GROUPS: HomeHubGroup[];
  export const HOME_ALL_LINK: { to: string; label: string };
  export const HOME_PRERENDER_LINKS: HomeLink[];
  export const HOME_ITEM_LIST: { name: string; path: string }[];
}
