import { apiFetch } from "./client";
import type { Candidate, Category, Vote, VoteCheckResult } from "./types";

export async function getCandidates(): Promise<Candidate[]> {
  return apiFetch<Candidate[]>("/vote/candidates");
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/vote/categories");
}

export async function getAddressVotes(
  address: string,
): Promise<VoteCheckResult> {
  return apiFetch<VoteCheckResult>(
    `/vote/check?address=${encodeURIComponent(address)}`,
  );
}

export async function submitVote(body: Vote): Promise<boolean> {
  console.log(`Submitting vote ${JSON.stringify(body)}`);

  try {
    await apiFetch("/vote/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`Could not submit vote: ${e as Error}: ${(e as any).detail}`);
    return Promise.resolve(false);
  }

  return Promise.resolve(true);
}
