import { component } from "@nativeframe/core";
import type { Interpolation } from "@nativeframe/core";
import { adminRouter } from "../router.js";

export const AdminApp = component(
  "admin-app",
  (_, { html }) => {
    const outlet = (): Interpolation => adminRouter.outlet() as Interpolation;

    return html`
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__logo">NF Admin</div>
          <nav class="admin-sidebar__nav">
            <a href="/admin" @click=${adminRouter.link}>Products</a>
            <a href="/admin/new" @click=${adminRouter.link}>New Product</a>
          </nav>
        </aside>
        <main class="admin-main">
          ${outlet}
        </main>
      </div>
    `;
  },
  {
    shadow: false,
    styles: `
      :scope {
        display: block;
        min-height: 100vh;
      }
      .admin-layout {
        display: flex;
        min-height: 100vh;
      }
      .admin-sidebar {
        width: 220px;
        background: #1a1a2e;
        color: #fff;
        display: flex;
        flex-direction: column;
        padding: 1.5rem 1rem;
        gap: 2rem;
        flex-shrink: 0;
      }
      .admin-sidebar__logo {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #a5b4fc;
      }
      .admin-sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .admin-sidebar__nav a {
        color: #d1d5db;
        text-decoration: none;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.9rem;
        transition: background 0.15s, color 0.15s;
      }
      .admin-sidebar__nav a:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
      .admin-main {
        flex: 1;
        padding: 2rem;
        overflow: auto;
      }
      .not-found {
        color: #6b7280;
      }
    `,
  },
);
