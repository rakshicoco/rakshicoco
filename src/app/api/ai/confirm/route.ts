import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePendingAction, cancelPendingAction } from "@/lib/ai/confirmation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { actionId, decision } = body;

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    if (decision === "cancel") {
      const cancelResult = cancelPendingAction(user.id, actionId);
      return NextResponse.json(cancelResult);
    }

    const result = await executePendingAction(user.id, actionId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("AI Confirm error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute action" }, { status: 400 });
  }
}
