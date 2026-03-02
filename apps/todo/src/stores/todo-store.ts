import { createStore } from "@nativeframe/store";
import type { Todo } from "../types.js";

export const todoStore = createStore({ todos: [] as Todo[] });
