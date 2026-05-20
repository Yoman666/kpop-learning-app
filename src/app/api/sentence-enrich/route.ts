import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  korean?: string;
  translation?: string;
};

type OpenAIContent = {
  translation: string;
  romanization: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const korean = body.korean?.trim() ?? "";
  if (!korean) {
    return NextResponse.json({ error: "korean is required" }, { status: 400 });
  }

  const hint = body.translation?.trim() ?? "";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      translation: hint,
      romanization: "",
      source: "hint-only" as const,
      notice:
        "Add OPENAI_API_KEY to .env.local for AI romanization and translation polish.",
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You help Korean learners. Given a Korean lyric line, respond with ONLY valid JSON:
{"translation":"<Simplified Chinese meaning>","romanization":"<Revised Romanization of Korean (RR), readable for learners>"}
Rules:
- translation: natural Simplified Chinese (zh-CN), one line.
- romanization: Revised Romanization of Korean for the Korean text, lowercase with spaces between eumun blocks where helpful.
- If a rough Chinese gloss is provided as hint, you may improve it but keep the same meaning.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              korean,
              existingChineseGloss: hint || null,
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          translation: hint,
          romanization: "",
          source: "fallback" as const,
          notice: `OpenAI error ${res.status}. ${errText.slice(0, 200)}`,
        },
        { status: 200 }
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({
        translation: hint,
        romanization: "",
        source: "fallback" as const,
      });
    }

    let parsed: OpenAIContent;
    try {
      parsed = JSON.parse(raw) as OpenAIContent;
    } catch {
      return NextResponse.json({
        translation: hint,
        romanization: "",
        source: "fallback" as const,
        notice: "Could not parse model JSON.",
      });
    }

    return NextResponse.json({
      translation: (parsed.translation || hint).trim(),
      romanization: (parsed.romanization || "").trim(),
      source: "openai" as const,
    });
  } catch {
    return NextResponse.json({
      translation: hint,
      romanization: "",
      source: "fallback" as const,
      notice: "Network error calling OpenAI.",
    });
  }
}
