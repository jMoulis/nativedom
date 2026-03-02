import { component, asyncSignal } from "@nativedom/core";
import type { Product } from "../types.js";
import { adminRouter } from "../router.js";

type ProductWithId = Product & { _id: string };

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const AdminProducts = component(
  "admin-products",
  (_, { html }) => {
    const {
      data: productList,
      loading,
      error,
      refetch,
    } = asyncSignal<ProductWithId[]>(() =>
      fetch("/api/products").then((r) => r.json()),
    );

    async function deleteProduct(id: string): Promise<void> {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      refetch();
    }

    return html`
      <div class="ap-wrap">
        <div class="ap-header">
          <h1 class="ap-title">Products</h1>
          <a class="ap-btn" href="/admin/new" @click=${adminRouter.link}
            >+ New Product</a
          >
        </div>
        ${() =>
          error.get()
            ? html`<p class="ap-error">Failed to load products.</p>`
            : loading.get()
              ? html`<p class="ap-loading">Loading…</p>`
              : html`
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${() =>
                        (productList.get() ?? []).map(
                          (p) => html`
                            <tr>
                              <td>${p.name}</td>
                              <td>${p.category}</td>
                              <td>${formatPrice(p.price)}</td>
                              <td>${p.stock}</td>
                              <td class="ap-actions">
                                <a
                                  class="ap-edit"
                                  href="${`/admin/edit/${p._id}`}"
                                  @click=${adminRouter.link}
                                  >Edit</a
                                >
                                <button
                                  class="ap-delete"
                                  @click=${() => void deleteProduct(p._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `,
                        )}
                    </tbody>
                  </table>
                `}
      </div>
    `;
  },
  {
    shadow: false,
    styles: `
      :scope {
        display: block;
      }
      .ap-wrap {
        max-width: 900px;
      }
      .ap-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      .ap-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0;
      }
      .ap-btn {
        display: inline-block;
        background: #6366f1;
        color: #fff;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        transition: background 0.15s;
      }
      .ap-btn:hover { background: #4f46e5; }
      .ap-error { color: #dc2626; }
      .ap-loading { color: #6b7280; }
      .ap-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      }
      .ap-table th,
      .ap-table td {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
      .ap-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
      }
      .ap-table td {
        border-bottom: 1px solid #f3f4f6;
        color: #111;
      }
      .ap-table tbody tr:last-child td {
        border-bottom: none;
      }
      .ap-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .ap-edit {
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .ap-edit:hover { text-decoration: underline; }
      .ap-delete {
        background: none;
        border: 1px solid #fca5a5;
        color: #dc2626;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.15s;
      }
      .ap-delete:hover { background: #fee2e2; }
    `,
  },
);
