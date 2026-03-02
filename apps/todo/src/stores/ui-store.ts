import { createStore } from "@nativeframe/store";
import type { Filter } from "../types.js";

export const uiStore = createStore({
  filter: "all" as Filter,
  editingId: null as string | null,
});
