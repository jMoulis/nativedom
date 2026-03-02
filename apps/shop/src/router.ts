import { html } from "@nativeframe/core";
import { createRouter } from "@nativeframe/router";
import { AdminProducts } from "./components/admin-products.js";
import { AdminForm } from "./components/admin-form.js";

export const adminRouter = createRouter([
  { path: "/admin", render: () => AdminProducts({}) },
  { path: "/admin/new", render: () => AdminForm({}) },
  {
    path: "/admin/edit/:id",
    render: (p) => AdminForm({ "product-id": p["id"] ?? "" }),
  },
  { path: "*", render: () => html`<p class="not-found">Page not found</p>` },
]);
