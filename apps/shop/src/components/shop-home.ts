import { component, ssrRender } from "@nativedom/core";

export const ShopHome = component(
  "shop-home",
  () => `
    ${ssrRender("shop-header", {})}
    <section class="hero">
      <div class="hero__inner">
        <h1 class="hero__title">Discover great products</h1>
        <p class="hero__sub">Hand-picked electronics, apparel & books — all in one place.</p>
      </div>
    </section>
    ${ssrRender("product-grid", {})}
  `,
  { shadow: false },
);
