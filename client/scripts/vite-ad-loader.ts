// Swaps the ad loader in index.html to match the active provider.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped
// font subset and force a fonts:subset regeneration for no reader benefit.
//
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// The loader tag lives outside Vue, in index.html, so ShAdSlot's provider
// switch cannot reach it. Flip VITE_AD_PROVIDER to adfit without this plugin
// and the AdSense loader stays on the page: two ad networks' scripts on one
// document, which is exactly what AdFit's operating policy 5.2 forbids
// ("타 광고 네트워크 플랫폼의 스크립트가 동시에 여러 개 게재된 경우") and what
// AdSense's inventory rules frown on. One switch has to move both.
//
// PRERENDER: the prerendered routes are built from the transformed index.html,
// so they inherit whichever loader this plugin left behind. The ad <ins> itself
// is only created after hydration, so prerendered HTML carries the loader and
// no ad markup - a crawler never reads an ad as content.
import type { Plugin } from "vite";

const ADSENSE_LOADER =
  /\s*<script[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>/g;

// Host named by the official guide (adfit.github.io/wiki/web-guide). The older
// t1.daumcdn.net serves the same bundle, but the operating policy bans running
// a script version Kakao no longer supports.
const ADFIT_LOADER =
  '<script async type="text/javascript" charset="utf-8" ' +
  'src="https://t1.kakaocdn.net/kas/static/ba.min.js" data-adfit="true"></script>';

export function adLoaderPlugin(): Plugin {
  return {
    name: "shakilabs-ad-loader",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        const provider = (
          context.server?.config.env.VITE_AD_PROVIDER ??
          process.env.VITE_AD_PROVIDER ??
          "adsense"
        )
          .trim()
          .toLowerCase();

        if (provider === "adsense") return html;

        // Strip AdSense first, unconditionally: "not adsense" must never leave
        // its loader behind, including when the value is a typo that resolved
        // to none.
        let next = html.replace(ADSENSE_LOADER, "");

        if (provider === "adfit") {
          // Kakao's guide asks for the script immediately above </body> so it
          // does not compete with the page's own resources.
          next = next.replace("</body>", `    ${ADFIT_LOADER}\n  </body>`);
        }

        return next;
      },
    },
  };
}
