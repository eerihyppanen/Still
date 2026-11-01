import { openDatabaseAsync } from "expo-sqlite";
import { HabitRepository } from "./repository";

let repositoryPromise: Promise<HabitRepository> | undefined;
export function getRepository(): Promise<HabitRepository> {
  if (!repositoryPromise)
    repositoryPromise = openDatabaseAsync("still.db")
      .then(async (db) => {
        const repository = new HabitRepository(db);
        await repository.initialize();
        return repository;
      })
      .catch((error) => {
        repositoryPromise = undefined;
        throw error;
      });
  return repositoryPromise;
}
