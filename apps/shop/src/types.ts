export interface Product {
  name: string;
  slug: string;
  description: string;
  price: number;       // cents — e.g. 2999 = $29.99
  category: string;
  stock: number;
  featured: boolean;
  createdAt: string;   // ISO date string
}
