"use client";

import { useContext, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Category, Candidate } from "@/lib/api/types";
import {
  getAddressVotes,
  getCategories,
  getCandidates,
  submitVote,
} from "@/lib/api/vote";
import Image from "next/image";
import { PhaAccountWidgetV1, PhaConnectCtx } from "@phantasma/connect-react";
import { toast } from "sonner";
import { observer } from "mobx-react-lite";

const VotePage = observer(() => {
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // UI state
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});

  const phaConnCtx = useContext(PhaConnectCtx);

  // Monitor wallet connection, reload votes if new wallet is connected
  useEffect(() => {
    (async () => {
      if (phaConnCtx?.is_connected) {
        toast(`Wallet ${phaConnCtx?.conn?.link.account?.address} connected`);

        if (phaConnCtx?.conn?.link.account?.address == undefined) {
          toast.error(`Cannot determine wallet's address`);
          return;
        }

        try {
          const addressVotes = await Promise.resolve(
            getAddressVotes(phaConnCtx?.conn?.link.account?.address),
          );
          setVotes({});
          if (addressVotes?.votes?.length > 0) {
            for (let i = 0; i < addressVotes?.votes.length; i++) {
              setVotes((prev) => ({
                ...prev,
                [addressVotes?.votes[i].category_slug]:
                  addressVotes?.votes[i].candidate_slug,
              }));
            }
          }
        } catch {
          setVotes({});
        }
      } else {
        toast(`Wallet disconnected`);
      }
    })();
  }, [phaConnCtx?.is_connected, phaConnCtx?.conn?.link.account?.address]);

  // Load categories and candidates
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cat, cand] = await Promise.all([
          getCategories(),
          getCandidates(),
        ]);
        if (!mounted) return;
        setCategories(cat ?? []);
        setCandidates(cand ?? []);
        if (!activeCat && (cat?.length ?? 0) > 0) {
          setActiveCat(cat[0].slug);
        }
      } catch {
        if (!mounted) return;
        setCategories([]);
        setCandidates([]);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Until backend provides a category->candidates mapping, show full candidate list in each category
  function getCandidatesFor(_categorySlug: string): Candidate[] {
    return candidates;
  }

  async function handleVote(categorySlug: string, candidateSlug: string) {
    if (!phaConnCtx.conn?.connected) {
      toast.error("Cannot vote, wallet is not connected");
      return;
    }
    const address = phaConnCtx.conn?.link.account.address;

    const voteMessage = `Voting with my address ${address} for ${candidateSlug} in category ${categorySlug}`;
    const {
      success,
      signature,
      random_b16: random_b16,
    } = await sign(voteMessage);

    if (!success) {
      toast.error("Failed signing vote message");
      return;
    }

    const payload = {
      addr: address,
      candidate_slug: candidateSlug,
      category_slug: categorySlug,
      msg: toHex(voteMessage),
      random: random_b16,
      signature: signature,
      sig_format: "Base16",
    };

    try {
      if (!(await submitVote(payload))) {
        toast.error("Could not submit vote");
        return;
      }
    } catch (err) {
      alert(`Network error: ${(err as Error).message}`);
    }

    setVotes((prev) => ({ ...prev, [categorySlug]: candidateSlug }));
  }

  function toHex(str: any) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
  }

  function sign(
    signMsg: string,
  ): Promise<{ success: boolean; signature: string; random_b16: string }> {
    const conn = phaConnCtx.conn;
    if (conn == null) {
      toast.error("Cannot sign, wallet is not connected");
      return Promise.resolve({ success: false, signature: "", random_b16: "" });
    }
    console.log(`Signing msg:${signMsg}`);
    const sign_msg = toHex(signMsg);
    let success = false;
    let signature = "";

    return new Promise((resolve) => {
      conn.signData(
        sign_msg,
        (data: any) => {
          let data_str = JSON.stringify(data);
          console.log(`[OK] sign. res: ${data_str}`);
          success = true;
          signature = data.signature;

          resolve({
            success: success,
            signature: signature.slice(4),
            random_b16: data.random,
          });
        },
        (err: any) => {
          console.log(`[FAIL] sign. res: ${JSON.stringify(err)}`);
          resolve({ success: false, signature: "", random_b16: "" });
        },
      );
    });
  }

  const doneCount = categories.filter((c) => votes[c.slug]).length;
  const activeCategory = categories.find((c) => c.slug === activeCat) || null;
  const list = activeCategory ? getCandidatesFor(activeCategory.slug) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex justify-end">
        <PhaAccountWidgetV1 state={phaConnCtx} />
      </div>
      {/* Categories block with tabs and voted badges */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => {
              const isActive = c.slug === activeCat;
              const isVoted = Boolean(votes[c.slug]);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setActiveCat(c.slug)}
                  className={[
                    "flex items-center justify-between rounded-xl border px-4 py-2 text-left transition",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-background hover:bg-accent",
                  ].join(" ")}
                >
                  <span className="truncate font-medium">{c.name}</span>
                  <span
                    className={[
                      "ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      isVoted
                        ? "bg-primary green text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {isVoted ? "voted" : "not voted"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active category content — one-column list of candidates */}
          <div>
            {activeCategory ? (
              <>
                <h2 className="mb-3 text-xl font-semibold">
                  {activeCategory.name}
                </h2>
                <ul className="space-y-3">
                  {list.map((candidate) => {
                    return (
                      <li
                        key={candidate.slug}
                        className={[
                          "rounded-xl border p-0 overflow-hidden",
                          votes[activeCategory.slug] === candidate.slug
                            ? "border-primary"
                            : "",
                        ].join(" ")}
                      >
                        {/* Banner image */}
                        {candidate.img_url ? (
                          <div className="w-full relative h-48 mt-4">
                            <Image
                              src={candidate.img_url}
                              alt={candidate.name}
                              fill
                              sizes="(max-width: 768px) 100vw,
                                     (max-width: 1200px) 50vw,
                                     33vw"
                              className="object-contain object-center rounded-t-xl"
                              priority={false}
                            />
                          </div>
                        ) : null}

                        {/* Content + action */}
                        <div className="flex items-start gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground font-medium">
                              {candidate.name}
                            </div>
                            {candidate.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                                {candidate.description}
                              </p>
                            )}

                            <a
                              href={candidate.extra as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-3 text-sm text-primary hover:underline"
                            >
                              {new URL(
                                candidate.extra as string,
                              ).hostname.replace(/^www\./, "")}
                            </a>

                            {votes[activeCategory.slug] === candidate.slug && (
                              <div className="mt-2 text-xs font-medium text-primary">
                                Your vote
                              </div>
                            )}
                          </div>

                          {(!votes[activeCategory.slug] ||
                            votes[activeCategory.slug] === candidate.slug) && (
                            <Button
                              variant={
                                votes[activeCategory.slug] === candidate.slug
                                  ? "default"
                                  : "secondary"
                              }
                              disabled={
                                votes[activeCategory.slug] === candidate.slug
                              }
                              onClick={() => {
                                if (!votes[activeCategory.slug]) {
                                  handleVote(
                                    activeCategory.slug,
                                    candidate.slug,
                                  );
                                }
                              }}
                            >
                              {votes[activeCategory.slug] === candidate.slug
                                ? "Voted"
                                : "Vote"}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No category selected
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-sm text-muted-foreground">
            Progress: <span className="font-medium">{doneCount}</span> /{" "}
            {categories.length}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});

export default VotePage;
