import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { CalendarCheck, Check, Clock3 } from "lucide-react";
import { CustomerTokenPage } from "@/components/vvs/token-page";
import { Countdown } from "@/components/vvs/countdown";
import { ErrorState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { offerService } from "@/lib/services";
import { fmtDay, fmtRange } from "@/lib/time";

export const Route = createFileRoute("/offer/$token")({
  head: () => ({ meta: [{ title: "A time opened for you — Ekström VVS" }, { name: "description", content: "Review and accept your reserved appointment time." }, { property: "og:title", content: "A time opened for you — Ekström VVS" }, { property: "og:description", content: "Review your reserved plumbing appointment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: Offer,
});

function Offer() {
  const { token } = Route.useParams();
  const get = useServerFn(offerService.get), respond = useServerFn(offerService.respond);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["offer", token], queryFn: () => get({ data: { token } }), retry: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookingToken, setBookingToken] = useState<string | null>(null);
  const refresh = useCallback(() => { qc.invalidateQueries({ queryKey: ["offer", token] }); }, [qc, token]);
  const act = async (accept: boolean) => { setBusy(true); setError(""); try { const r = await respond({ data: { token, accept } }); setBookingToken(r.accessToken); refresh(); } catch (e) { setError(errMsg(e)); refresh(); } finally { setBusy(false); } };
  return <QueryState q={q} skeleton={<CustomerTokenPage eyebrow="PRIORITY OFFER" title="Loading your offer…" description=""><div className="h-60 animate-pulse rounded-md bg-muted"/></CustomerTokenPage>}>{({ offer }) => {
    if (!offer) return <CustomerTokenPage eyebrow="PRIORITY OFFER" title="This link isn't valid." description="The offer may have been withdrawn."><span/></CustomerTokenPage>;
    const when = `${fmtDay(offer.slot_start)} · ${fmtRange(offer.slot_start, offer.duration_min)}`;
    const title = offer.status === "accepted" ? "This time is yours." : offer.status === "pending" ? "A time just opened for you." : offer.status === "expired" ? "This offer has expired." : "Offer declined.";
    const desc = offer.status === "pending" ? "You're first in line for a schedule opening that matches your request." : offer.status === "accepted" ? "Your appointment is confirmed." : offer.status === "expired" ? "The 15 minutes passed, so the time was offered to the next customer. You're still on the waitlist." : "No problem — you remain on the waitlist.";
    return <CustomerTokenPage eyebrow="PRIORITY OFFER" title={title} description={desc}><Card className="rounded-md p-7 text-center shadow-none">
      {offer.status === "accepted" ? <><div className="mx-auto grid size-16 place-items-center rounded-full bg-success text-success-foreground animate-success"><Check/></div><p className="mt-5 text-2xl font-bold">Booked</p><p className="mt-2 text-muted-foreground">{when}</p>{bookingToken && <Button asChild className="mt-6"><Link to="/access/$token" params={{ token: bookingToken }}>Confirm property access</Link></Button>}</>
      : offer.status === "pending" ? <><CalendarCheck className="mx-auto size-7 text-primary"/><p className="mt-4 text-sm text-muted-foreground">{offer.waitlist_entries?.title}</p><p className="mt-1 text-2xl font-bold sm:text-3xl">{when}</p><p className="mt-7 text-sm text-muted-foreground">Reserved for you for</p><div className="mt-3"><Countdown ring seconds={offer.secondsLeft} total={900} onComplete={refresh}/></div>{error && <div className="mt-4 text-left"><ErrorState message={error}/></div>}<div className="mt-7 grid gap-3"><Button size="lg" disabled={busy} onClick={() => act(true)}>{busy ? "Confirming…" : "Accept this time"}</Button><Button variant="ghost" disabled={busy} onClick={() => act(false)}>Decline</Button></div></>
      : <><Clock3 className="mx-auto size-8 text-muted-foreground"/><p className="mt-4 text-muted-foreground">{when}</p></>}
    </Card></CustomerTokenPage>;
  }}</QueryState>;
}
