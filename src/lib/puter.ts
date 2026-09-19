// Browser-only Puter.js integration.
// Puter authenticates the user in the browser; no API key is stored or sent by Ghost.

type PuterChatResponse =
  | string
  | {
      message?: { content?: string | { text?: string }[] };
      text?: string;
    };

type PuterApi = {
  ai: {
    chat: (
      prompt: string,
      options?: { model?: string; stream?: boolean },
    ) => Promise<PuterChatResponse>;
  };
};

declare global {
  interface Window {
    puter?: PuterApi;
  }
}

let puterPromise: Promise<PuterApi> | null = null;

function loadPuter(): Promise<PuterApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Puter.js is browser-only."));
  }
  if (window.puter) return Promise.resolve(window.puter);
  if (puterPromise) return puterPromise;

  puterPromise = new Promise<PuterApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.puter.com/v2/"]',
    );
    const script = existing ?? document.createElement("script");
    const finish = () => {
      if (window.puter) resolve(window.puter);
      else reject(new Error("Puter.js loaded without its API."));
    };
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Could not load Puter.js.")),
      { once: true },
    );
    if (!existing) {
      script.src = "https://js.puter.com/v2/";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return puterPromise;
}

function responseText(response: PuterChatResponse): string {
  if (typeof response === "string") return response;
  const content = response.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? "").join("");
  }
  return response.text ?? "";
}

export async function puterChat(prompt: string, model?: string): Promise<string> {
  const puter = await loadPuter();
  const response = await puter.ai.chat(prompt, {
    model: model || "openai/gpt-5.5",
    stream: false,
  });
  const text = responseText(response).trim();
  if (!text) throw new Error("Puter returned an empty response.");
  return text;
}
