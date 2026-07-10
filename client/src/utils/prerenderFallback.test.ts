import { describe, expect, it, vi } from "vitest";
import { removePrerenderFallback } from "./prerenderFallback";

describe("removePrerenderFallback", () => {
  it("removes every prerender fallback returned by the body selector", () => {
    const first = { remove: vi.fn() };
    const second = { remove: vi.fn() };
    const root = {
      querySelectorAll: vi.fn(() => [first, second]),
    } as unknown as ParentNode;

    expect(removePrerenderFallback(root)).toBe(2);
    expect(root.querySelectorAll).toHaveBeenCalledWith(
      "body > [data-seo-prerender]",
    );
    expect(first.remove).toHaveBeenCalledOnce();
    expect(second.remove).toHaveBeenCalledOnce();
  });
});
