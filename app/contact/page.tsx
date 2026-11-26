"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { PageIntro } from "@/components/sections";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setStatus("error");
      setErrorMessage("The contact form is not configured yet. Please try again later.");
      return;
    }

    try {
      const supabase = createClient(url, key);
      const { error } = await supabase.from("contact_messages").insert({ name, email, message });
      if (error) throw error;
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Your message could not be sent. Please try again or email the studio directly.");
    }
  }

  return (
    <main>
      <PageIntro kicker="07 / Contact" title="Let’s start a conversation." copy="For collaborations, creative projects, opportunities or simply to say hello, send a note below." />
      <section className="wrap grid gap-14 pb-28 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="eyebrow text-[#6B2638]">Connect with the studio</p>
          <h2 className="serif mt-5 text-4xl">Good things begin with a conversation.</h2>
          <p className="mt-6 text-sm leading-7 text-black/60">Email: <a className="underline" href="mailto:hello@harsh.studio">hello@harsh.studio</a></p>
          <p className="mt-3 text-xs text-black/40">Update this sample email before publishing.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block"><span className="eyebrow">Your name</span><input name="name" required maxLength={100} className="mt-2 w-full border-b border-black/30 bg-transparent py-3 outline-none focus:border-[#6B2638]" placeholder="Name" /></label>
          <label className="block"><span className="eyebrow">Email address</span><input name="email" required type="email" maxLength={254} className="mt-2 w-full border-b border-black/30 bg-transparent py-3 outline-none focus:border-[#6B2638]" placeholder="you@example.com" /></label>
          <label className="block"><span className="eyebrow">Message</span><textarea name="message" required minLength={5} maxLength={5000} rows={4} className="mt-2 w-full resize-y border-b border-black/30 bg-transparent py-3 outline-none focus:border-[#6B2638]" placeholder="Tell me about your idea..." /></label>
          <button disabled={status === "sending"} className="bg-[#6B2638] px-7 py-4 text-[10px] uppercase tracking-[.2em] text-white hover:bg-[#171614] disabled:opacity-60">{status === "sending" ? "Sending..." : "Send message ↗"}</button>
          {status === "success" && <p role="status" className="text-sm text-[#6B2638]">Thank you. Your message has been sent.</p>}
          {status === "error" && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
        </form>
      </section>
    </main>
  );
}
