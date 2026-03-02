type WithId<T> = T & { _id: string };

export class Collection<T extends object> {
  #docs = new Map<string, WithId<T>>();

  find(filter?: Partial<T>): WithId<T>[] {
    const all = Array.from(this.#docs.values());
    if (!filter) return all;
    return all.filter(doc =>
      (Object.keys(filter) as (keyof T)[]).every(k => doc[k] === filter[k]),
    );
  }

  findById(id: string): WithId<T> | null {
    return this.#docs.get(id) ?? null;
  }

  findOne(filter: Partial<T>): WithId<T> | null {
    return this.find(filter)[0] ?? null;
  }

  insertOne(doc: T): WithId<T> {
    const _id = crypto.randomUUID();
    const withId: WithId<T> = { ...doc, _id };
    this.#docs.set(_id, withId);
    return withId;
  }

  updateOne(id: string, update: Partial<T>): WithId<T> | null {
    const existing = this.#docs.get(id);
    if (!existing) return null;
    const updated: WithId<T> = { ...existing, ...update };
    this.#docs.set(id, updated);
    return updated;
  }

  deleteOne(id: string): boolean {
    return this.#docs.delete(id);
  }

  count(): number {
    return this.#docs.size;
  }
}
