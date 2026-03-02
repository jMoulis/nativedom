import { Collection } from "./collection.js";
import type { Product } from "../types.js";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const products = new Collection<Product>();

const seed: Omit<Product, "slug" | "createdAt">[] = [
  {
    name: "Wireless Headphones",
    description: "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 7999,
    category: "Electronics",
    stock: 42,
    featured: true,
  },
  {
    name: "Mechanical Keyboard",
    description: "Compact 75% layout mechanical keyboard with tactile brown switches and RGB backlight.",
    price: 12999,
    category: "Electronics",
    stock: 18,
    featured: false,
  },
  {
    name: "Classic Crew Tee",
    description: "100% organic cotton crew-neck tee in a relaxed fit. Available in 8 colours.",
    price: 2999,
    category: "Apparel",
    stock: 120,
    featured: true,
  },
  {
    name: "Merino Wool Beanie",
    description: "Soft and warm merino wool beanie, one size fits all. Machine washable.",
    price: 1999,
    category: "Apparel",
    stock: 65,
    featured: false,
  },
  {
    name: "Clean Code",
    description: "Robert C. Martin's guide to writing readable, maintainable software. A must-read for every developer.",
    price: 3499,
    category: "Books",
    stock: 30,
    featured: false,
  },
  {
    name: "The Pragmatic Programmer",
    description: "From journeyman to master — timeless advice on crafting software and growing as a developer.",
    price: 3999,
    category: "Books",
    stock: 25,
    featured: true,
  },
];

const now = new Date().toISOString();
for (const item of seed) {
  products.insertOne({
    ...item,
    slug: slugify(item.name),
    createdAt: now,
  });
}
