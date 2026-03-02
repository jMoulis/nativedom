import { loadFromStorage, setupPersistence } from "./lib/persistence.js";
import "./components/todo-form.js";
import "./components/todo-list.js"; // also registers todo-item
import "./components/todo-footer.js";

// All imports evaluated first → components defined → elements connected → rendered with empty list.
// loadFromStorage() sets todos from localStorage → triggers todo-list effect → list fills.
// setupPersistence() installs an effect to sync every change back to localStorage.
loadFromStorage();
setupPersistence();
