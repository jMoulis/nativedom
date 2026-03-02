import { component, asyncSignal, trustedHtml } from "@nativeframe/core";
import type { Product } from "../types.js";
import { adminRouter } from "../router.js";

type ProductWithId = Product & { _id: string };

export const AdminForm = component<{ "product-id"?: string }>(
  "admin-form",
  ({ "product-id": productId }, { html, signal, computed, watch }) => {
    const isEditing = Boolean(productId);

    // Form field signals
    const name = signal("");
    const price = signal("");
    const description = signal("");
    const category = signal("Electronics");
    const stock = signal("0");
    const featured = signal(false);

    const isValid = computed(
      () => name.get().trim() !== "" && Number(price.get()) > 0,
    );
    const submitError = signal<string | null>(null);

    // Load existing product when editing
    const existing = isEditing
      ? asyncSignal<ProductWithId>(() =>
          fetch(`/api/products/${productId}`).then((r) => r.json()),
        )
      : null;

    // Populate form fields when product data arrives
    if (existing) {
      watch(
        () => existing.data.get(),
        (product) => {
          if (!product) return;
          name.set(product.name);
          price.set(String(product.price));
          description.set(product.description);
          category.set(product.category);
          stock.set(String(product.stock));
          featured.set(product.featured);
        },
      );
    }

    async function handleSubmit(e: Event): Promise<void> {
      e.preventDefault();
      submitError.set(null);

      const payload: Omit<Product, "slug" | "createdAt"> &
        Partial<Pick<Product, "slug" | "createdAt">> = {
        name: name.get().trim(),
        price: Number(price.get()),
        description: description.get().trim(),
        category: category.get().trim(),
        stock: Number(stock.get()),
        featured: featured.get(),
      };

      const url = isEditing ? `/api/products/${productId}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Server error: ${msg}`);
      }

      adminRouter.navigate("/admin");
    }

    const categories = ["Electronics", "Apparel", "Books", "Other"];

    return html`
      <div class="af-wrap">
        <h1 class="af-title">${isEditing ? "Edit Product" : "New Product"}</h1>
        ${() =>
          submitError.get()
            ? html`<p class="af-error">${() => submitError.get()}</p>`
            : ""}
        ${existing
          ? html`${() =>
              existing.loading.get()
                ? html`<p class="af-loading">Loading product…</p>`
                : ""}`
          : ""}
        <form class="af-form" @submit=${(e: Event) => void handleSubmit(e)}>
          <div class="af-field">
            <label class="af-label" for="af-name">Name</label>
            <input
              id="af-name"
              class="af-input"
              type="text"
              .value="${() => name.get()}"
              @input=${(e: Event) =>
                name.set((e.target as HTMLInputElement).value)}
              required
            />
          </div>
          <div class="af-field">
            <label class="af-label" for="af-price">Price (cents)</label>
            <input
              id="af-price"
              class="af-input"
              type="number"
              min="1"
              .value="${() => price.get()}"
              @input=${(e: Event) =>
                price.set((e.target as HTMLInputElement).value)}
              required
            />
            <small class="af-hint">e.g. 2999 = $29.99</small>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-desc">Description</label>
            <textarea
              id="af-desc"
              class="af-input af-textarea"
              rows="4"
              .value="${() => description.get()}"
              @input=${(e: Event) =>
                description.set((e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-cat">Category</label>
            <select
              id="af-cat"
              class="af-input"
              .value="${() => category.get()}"
              @change=${(e: Event) =>
                category.set((e.target as HTMLSelectElement).value)}
            >
              ${trustedHtml(
                categories
                  .map((c) => `<option value="${c}">${c}</option>`)
                  .join(""),
              )}
            </select>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-stock">Stock</label>
            <input
              id="af-stock"
              class="af-input"
              type="number"
              min="0"
              .value="${() => stock.get()}"
              @input=${(e: Event) =>
                stock.set((e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="af-field af-field--check">
            <input
              id="af-featured"
              type="checkbox"
              .checked="${() => featured.get()}"
              @change=${(e: Event) =>
                featured.set((e.target as HTMLInputElement).checked)}
            />
            <label class="af-label" for="af-featured">Featured product</label>
          </div>
          <div class="af-actions">
            <button
              class="af-submit"
              type="submit"
              .disabled="${() => !isValid.get()}"
            >
              ${isEditing ? "Save Changes" : "Create Product"}
            </button>
            <a class="af-cancel" href="/admin" @click=${adminRouter.link}
              >Cancel</a
            >
          </div>
        </form>
      </div>
    `;
  },
  {
    shadow: false,
    onError: (err) => {
      console.error("AdminForm error:", err);
      return `<p class="af-error">Something went wrong: ${String(err instanceof Error ? err.message : err)}</p>`;
    },
    styles: `
      :scope {
        display: block;
      }
      .af-wrap {
        max-width: 560px;
      }
      .af-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0 0 1.5rem;
      }
      .af-error {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }
      .af-loading {
        color: #6b7280;
        margin-bottom: 1rem;
      }
      .af-form {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .af-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .af-field--check {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
      .af-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
      }
      .af-input {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        font-family: inherit;
        color: #111;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
        box-sizing: border-box;
      }
      .af-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
      }
      .af-textarea {
        resize: vertical;
      }
      .af-hint {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .af-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 0.5rem;
      }
      .af-submit {
        background: #6366f1;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0.6rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .af-submit:hover:not(:disabled) { background: #4f46e5; }
      .af-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      .af-cancel {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .af-cancel:hover { text-decoration: underline; }
    `,
  },
);
