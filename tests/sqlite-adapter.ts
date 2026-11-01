import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { SqlDatabase, SqlParam } from "../src/data/repository";
export function sqliteAdapter(path = ":memory:"): {
  db: SqlDatabase;
  close: () => void;
} {
  const raw = new DatabaseSync(path);
  return {
    close: () => raw.close(),
    db: {
      async execAsync(sql) {
        raw.exec(sql);
      },
      async runAsync(sql, ...params: SqlParam[]) {
        const result = raw.prepare(sql).run(...(params as SQLInputValue[]));
        return { changes: Number(result.changes) };
      },
      async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
        return raw.prepare(sql).all(...(params as SQLInputValue[])) as T[];
      },
      async getFirstAsync<T>(sql: string, ...params: SqlParam[]) {
        return (
          (raw.prepare(sql).get(...(params as SQLInputValue[])) as
            T | undefined) ?? null
        );
      },
    },
  };
}
