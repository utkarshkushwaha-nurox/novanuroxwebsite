import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const TOTAL_SEATS = 20;

export function useSeatCount() {
  const [paidCount, setPaidCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured) {
        if (active) {
          setPaidCount(0);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase.rpc("paid_count");
      if (!active) return;
      if (error) {
        console.error("paid_count error:", error.message);
        setPaidCount(0);
      } else {
        setPaidCount(typeof data === "number" ? data : 0);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const seatsLeft = paidCount === null ? TOTAL_SEATS : Math.max(0, TOTAL_SEATS - paidCount);
  const isFull = paidCount !== null && paidCount >= TOTAL_SEATS;

  return { paidCount: paidCount ?? 0, seatsLeft, isFull, loading, totalSeats: TOTAL_SEATS };
}
