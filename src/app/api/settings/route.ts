import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";
import { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body: Settings = await req.json();
  saveSettings(body);
  return NextResponse.json({ success: true });
}
