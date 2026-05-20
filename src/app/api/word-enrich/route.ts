import { NextRequest, NextResponse } from "next/server";

import { translateKoreanToChinese } from "@/lib/lyrics-service";

export const dynamic = "force-dynamic";

type Body = {
  korean?: string;
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const translation = await translateKoreanToChinese(korean);
    return NextResponse.json({
      translation: translation || "—",
      romanization: "",
      source: "mymemory" as const,
      notice:
        translation
          ? undefined
          : "Add OPENAI_API_KEY for richer word glosses and romanization.",
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
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You help Korean learners study individual words from K-pop lyrics. Given a Korean word or short fragment, respond with ONLY valid JSON:
{"translation":"<Simplified Chinese gloss for this word>","romanization":"<Revised Romanization (RR) for the Korean>"}
Rules:
- translation: concise Simplified Chinese (zh-CN) for the word in isolation.
- romanization: RR for the Korean fragment only, lowercase.`,
          },
          { role: "user", content: JSON.stringify({ korean }) },
        ],
      }),
    });

    if (!res.ok) {
      const fallback = await translateKoreanToChinese(korean);
      return NextResponse.json({
        translation: fallback || "—",
        romanization: "",
        source: "fallback" as const,
        notice: `OpenAI error ${res.status}.`,
      });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      const fallback = await translateKoreanToChinese(korean);
      return NextResponse.json({
        translation: fallback || "—",
        romanization: "",
        source: "fallback" as const,
      });
    }

    let parsed: OpenAIContent;
    try {
      parsed = JSON.parse(raw) as OpenAIContent;
    } catch {
      const fallback = await translateKoreanToChinese(korean);
      return NextResponse.json({
        translation: fallback || "—",
        romanization: "",
        source: "fallback" as const,
        notice: "Could not parse model JSON.",
      });
    }

    const translation =
      (parsed.translation || "").trim() ||
      (await translateKoreanToChinese(korean)) ||
      "—";

    return NextResponse.json({
      translation,
      romanization: (parsed.romanization || "").trim(),
      source: "openai" as const,
    });
  } catch {
    const fallback = await translateKoreanToChinese(korean);
    return NextResponse.json({
      translation: fallback || "—",
      romanization: "",
      source: "fallback" as const,
      notice: "Network error calling OpenAI.",
    });
  }
}
