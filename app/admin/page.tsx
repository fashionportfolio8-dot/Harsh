"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.app_metadata?.role === "admin";

  const loadMessages = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("contact_messages")
      .select("id,name,email,message,created_at")
      .order("created_at", { ascending: false });
    if (queryError) {
      setError("Could not load messages. Please check the admin role and database access.");
    } else {
      setMessages((data ?? []) as ContactMessage[]);
      setSelected((current) => current ? ((data ?? []).find((item) => item.id === current.id) as ContactMessage | undefined) ?? null : null);
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Admin login is not configured. Add the Supabase URL and publishable key to your hosting environment.");
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) void loadMessages();
  }, [isAdmin, loadMessages]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) {
      setError("Login failed. Check your email and password.");
    } else if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account does not have administrator access.");
    } else {
      setUser(data.user);
      setPassword("");
    }
    setBusy(false);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
    setSelected(null);
  }

  if (loading) {
    return <main className="wrap min-h-[65vh] py-24"><p className="eyebrow">Harsh / Admin</p><p className="mt-5 text-sm text-black/60">Loading secure dashboard…</p></main>;
  }

  if (!user || !isAdmin) {
    return (
      <main className="wrap flex min-h-[75vh] items-center justify-center py-20">
        <section className="w-full max-w-md border border-black/10 bg-white p-8 md:p-10">
          <p className="eyebrow text-[#6B2638]">Private workspace</p>
          <h1 className="serif mt-4 text-4xl">Admin sign in.</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">Sign in with the administrator account for the Harsh fashion portfolio.</p>
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <label className="block"><span className="eyebrow">Email address</span><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-b border-black/25 bg-transparent py-3 outline-none focus:border-[#6B2638]" /></label>
            <label className="block"><span className="eyebrow">Password</span><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-b border-black/25 bg-transparent py-3 outline-none focus:border-[#6B2638]" /></label>
            <button disabled={busy} className="w-full bg-[#6B2638] px-6 py-4 text-[10px] uppercase tracking-[.2em] text-white hover:bg-[#171614] disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
          <p className="mt-8 text-xs leading-5 text-black/40">Administrator accounts are created privately in Supabase. Public sign-up is not available.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap min-h-[75vh] py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-black/10 pb-8">
        <div><p className="eyebrow text-[#6B2638]">Harsh / Private workspace</p><h1 className="serif mt-3 text-4xl md:text-5xl">Enquiries.</h1><p className="mt-3 text-sm text-black/55">{messages.length} {messages.length === 1 ? "message" : "messages"} received</p></div>
        <div className="flex gap-3"><button onClick={() => void loadMessages()} disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] uppercase tracking-[.16em] disabled:opacity-50">{busy ? "Loading…" : "Refresh"}</button><button onClick={() => void handleLogout()} className="bg-[#171614] px-5 py-3 text-[10px] uppercase tracking-[.16em] text-white">Sign out</button></div>
      </div>
      {error && <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <section className="space-y-3">
          <h2 className="eyebrow mb-4">Inbox</h2>
          {messages.length === 0 && !busy ? <p className="border border-dashed border-black/20 p-8 text-sm text-black/50">No enquiries yet. New contact form submissions will appear here.</p> : messages.map((message) => (
            <button key={message.id} onClick={() => setSelected(message)} className={`block w-full border p-5 text-left transition ${selected?.id === message.id ? "border-[#6B2638] bg-[#6B2638]/5" : "border-black/10 hover:border-black/30"}`}>
              <span className="flex items-center justify-between gap-3"><strong className="text-sm font-medium">{message.name}</strong><span className="text-[10px] text-black/40">{new Date(message.created_at).toLocaleDateString()}</span></span>
              <span className="mt-2 block truncate text-xs text-black/50">{message.email}</span>
              <span className="mt-3 block text-sm leading-6 text-black/70">{message.message}</span>
            </button>
          ))}
        </section>
        <section className="min-h-64 border border-black/10 p-6 md:p-8">
          <p className="eyebrow text-[#6B2638]">Message details</p>
          {selected ? <><h2 className="serif mt-5 text-3xl">{selected.name}</h2><a className="mt-3 inline-block text-sm underline" href={`mailto:${selected.email}`}>{selected.email}</a><p className="mt-2 text-xs text-black/40">{new Date(selected.created_at).toLocaleString()}</p><div className="mt-8 whitespace-pre-wrap border-t border-black/10 pt-6 text-sm leading-7 text-black/75">{selected.message}</div><a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: Your enquiry to Harsh Studio")}`} className="mt-8 inline-block bg-[#6B2638] px-6 py-4 text-[10px] uppercase tracking-[.16em] text-white">Reply by email ↗</a></> : <p className="mt-6 text-sm leading-6 text-black/50">Select an enquiry from your inbox to read the full message and reply.</p>}
        </section>
      </div>
    </main>
  );
}
