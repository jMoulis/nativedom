import { createStore } from "@nativedom/store";
import type { Todo } from "../types.js";

export const todoStore = createStore({ todos: [] as Todo[] });
