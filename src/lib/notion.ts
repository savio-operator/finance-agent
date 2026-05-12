import { Client } from "@notionhq/client";

function getNotionClient(): Client | null {
  const key = process.env.NOTION_API_KEY;
  if (!key || key === "your-notion-api-key-here") return null;
  return new Client({ auth: key });
}

export async function readNotionPage(pageId: string): Promise<string> {
  const notion = getNotionClient();
  if (!notion) return "";

  try {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const texts: string[] = [];

    for (const block of blocks.results) {
      if ("type" in block) {
        const b = block as Record<string, unknown>;
        const type = b.type as string;
        const content = b[type] as Record<string, unknown> | undefined;
        if (content && "rich_text" in content) {
          const richText = content.rich_text as Array<{ plain_text: string }>;
          texts.push(richText.map((t) => t.plain_text).join(""));
        }
      }
    }

    return texts.join("\n");
  } catch (e) {
    console.error("Error reading Notion page:", e);
    return "";
  }
}

export async function writeToNotionPage(pageId: string, title: string, content: string): Promise<boolean> {
  const notion = getNotionClient();
  if (!notion) return false;

  try {
    // Append content as blocks to the page
    const paragraphs = content.split("\n").filter((line) => line.trim());

    await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: "block" as const,
          type: "heading_2" as const,
          heading_2: {
            rich_text: [{ type: "text" as const, text: { content: title } }],
          },
        },
        {
          object: "block" as const,
          type: "divider" as const,
          divider: {},
        },
        ...paragraphs.map((text) => ({
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [{ type: "text" as const, text: { content: text } }],
          },
        })),
      ],
    });

    return true;
  } catch (e) {
    console.error("Error writing to Notion:", e);
    return false;
  }
}
