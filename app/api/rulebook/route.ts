import { extractProposals } from "@/lib/extract";
import { readGuideline } from "@/lib/documents";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Parses a brand guideline and returns proposals with page citations.
 * Proposals are inert until a person confirms each one in the UI.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form with a file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Attach a guideline as the 'file' field." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Guidelines are limited to 8 MB." }, { status: 413 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pages = await readGuideline(file.name, bytes);
    const textLength = pages.reduce((n, p) => n + p.text.length, 0);
    if (textLength < 20) {
      return Response.json(
        { error: "No selectable text found. If this is a scan, export it with OCR first." },
        { status: 422 }
      );
    }
    return Response.json({
      docName: file.name,
      pages: pages.length,
      characters: textLength,
      proposals: extractProposals(pages, file.name),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not read the guideline." },
      { status: 422 }
    );
  }
}
