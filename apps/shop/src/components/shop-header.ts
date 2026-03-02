import { component } from "@nativedom/core";

export const ShopHeader = component(
  "shop-header",
  (_, { html }) => html`
    <header class="shop-header">
      <a class="logo" href="/">NativeFrame Shop</a>
      <nav class="nav">
        <a href="/">Shop</a>
        <a href="/admin">Admin</a>
      </nav>
    </header>
  `,
  {
    shadow: false,
    styles: `
      :scope {
        display: block;
        background: #1a1a2e;
        padding: 0 2rem;
      }
      .shop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .logo {
        color: #fff;
        text-decoration: none;
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .nav {
        display: flex;
        gap: 1.5rem;
      }
      .nav a {
        color: #ccc;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.15s;
      }
      .nav a:hover {
        color: #fff;
      }
    `,
  },
);
