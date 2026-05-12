import { NextResponse } from "next/server";
import { readNotionPage, writeToNotionPage } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const pageId = process.env.NOTION_FINANCE_PAGE_ID;
  if (!pageId || pageId === "your-notion-finance-page-id-here") {
    return NextResponse.json({ content: "", configured: false });
  }

  const content = await readNotionPage(pageId);
  return NextResponse.json({ content, configured: true });
}

export async function POST(req: Request) {
  const { title, content } = await req.json();
  const pageId = process.env.NOTION_REPORT_PAGE_ID;

  if (!pageId || pageId === "your-notion-report-page-id-here") {
    return NextResponse.json({ success: false, error: "Notion report page not configured" });
  }

  const success = await writeToNotionPage(pageId, title, content);
  return NextResponse.json({ success });
}
