export type Candidate = {
  slug: string;
  name: string;
  description?: string;
  img_url?: string | null;
  extra?: unknown;
};

export type Category = {
  slug: string;
  name: string;
};

export type Vote = {
  addr: string;
  candidate_slug: string;
  category_slug: string;
  extra?: unknown;
  msg: string;
  sig_format?: string;
  signature: string;
};

export type VoteCheckResult = {
  votes: Vote[];
};
