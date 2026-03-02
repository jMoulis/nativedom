// Import all components to trigger customElements.define on the client.
// SSR-only shell components that return plain template strings (shop-home,
// product-detail) are intentionally omitted: registering them as custom
// elements would cause the browser to treat their string return value as a
// DOMString text node, replacing all SSR markup with escaped HTML entities.
// The same pattern is used by todo-app: only client-interactive components
// are registered here.
import "./components/shop-header.js";
import "./components/product-card.js";
import "./components/product-grid.js";
import "./components/admin-app.js";
import "./components/admin-products.js";
import "./components/admin-form.js";

// Import router so it registers popstate/click listeners
import "./router.js";
