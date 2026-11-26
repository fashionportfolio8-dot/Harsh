"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

type ContactMessage = { id: string; name: string; email: string; message: string; created_at: string };
type ContentType = "collection" | "project" | "sketch" | "material" | "about";
type PortfolioItem = { id: string; content_type: ContentType; title: string; slug: string; description: string; image_url: string | null; category: string | null; client: string | null; year: string | null; sort_order: number; is_published: boolean; created_at: string };
const types: { value: ContentType; label: string }[] = [
  { value: "collection", label: "Collections" }, { value: "project", label: "Projects" },
  { value: "sketch", label: "Sketches" }, { value: "material", label: "Materials" }, { value: "about", label: "About details" }
];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const blank = { content_type: "collection" as ContentType, title: "", slug: "", description: "", image_url: "", category: "", client: "", year: "", sort_order: "0", is_published: false };

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [tab, setTab] = useState<"content" | "inbox">("content");
  const [filter, setFilter] = useState<ContentType>("collection");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isAdmin = user?.app_metadata?.role === "admin";

  const loadContent = useCallback(async () => {
    if (!supabase) return;
    const { data, error: queryError } = await supabase.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false });
    if (queryError) setError("Could not load portfolio content. Check the database migration and admin access.");
    else setItems((data ?? []) as PortfolioItem[]);
  }, []);
  const loadMessages = useCallback(async () => {
    if (!supabase) return;
    const { data, error: queryError } = await supabase.from("contact_messages").select("id,name,email,message,created_at").order("created_at", { ascending: false });
    if (queryError) setError("Could not load enquiries. Check your administrator access.");
    else { setMessages((data ?? []) as ContactMessage[]); setSelected((current) => current ? ((data ?? []).find((x) => x.id === current.id) as ContactMessage | undefined) ?? null : null); }
  }, []);

  useEffect(() => {
    if (!supabase) { setError("Admin login is not configured. Add the Supabase URL and publishable key to your hosting environment."); setLoading(false); return; }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (isAdmin) { void loadContent(); void loadMessages(); } }, [isAdmin, loadContent, loadMessages]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return; setBusy(true); setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) setError("Login failed. Check your email and password.");
    else if (data.user?.app_metadata?.role !== "admin") { await supabase.auth.signOut(); setError("This account does not have administrator access."); }
    else { setUser(data.user); setPassword(""); }
    setBusy(false);
  }
  async function handleLogout() { if (!supabase) return; await supabase.auth.signOut(); setUser(null); setItems([]); setMessages([]); setSelected(null); }
  function startEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({ content_type: item.content_type, title: item.title, slug: item.slug, description: item.description, image_url: item.image_url ?? "", category: item.category ?? "", client: item.client ?? "", year: item.year ?? "", sort_order: String(item.sort_order), is_published: item.is_published });
    setError(""); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm() { setForm(blank); setEditingId(null); setError(""); setNotice(""); }
  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setError(""); setNotice("");
    const slug = (form.slug || form.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = { content_type: form.content_type, title: form.title.trim(), slug, description: form.description.trim(), image_url: form.image_url.trim() || null, category: form.category.trim() || null, client: form.client.trim() || null, year: form.year.trim() || null, sort_order: Number(form.sort_order) || 0, is_published: form.is_published, updated_at: new Date().toISOString() };
    const result = editingId ? await supabase.from("portfolio_items").update(payload).eq("id", editingId) : await supabase.from("portfolio_items").insert(payload);
    if (result.error) setError(result.error.message.includes("duplicate") ? "This content type already has an item with that URL slug. Change the title or slug." : result.error.message);
    else { setNotice(editingId ? "Content updated successfully." : "Content added successfully."); resetForm(); await loadContent(); }
    setBusy(false);
  }
  async function deleteContent(item: PortfolioItem) {
    if (!supabase || !window.confirm("Delete this portfolio item permanently?")) return;
    setBusy(true); setError(""); const { error: deleteError } = await supabase.from("portfolio_items").delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message); else { setNotice("Content deleted."); if (editingId === item.id) resetForm(); await loadContent(); }
    setBusy(false);
  }
  async function togglePublish(item: PortfolioItem) {
    if (!supabase) return; setBusy(true); setError("");
    const { error: updateError } = await supabase.from("portfolio_items").update({ is_published: !item.is_published, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (updateError) setError(updateError.message); else { setNotice(item.is_published ? "Item moved to draft." : "Item published on the website."); await loadContent(); }
    setBusy(false);
  }

  if (loading) return <main className="wrap min-h-[65vh] py-24"><p className="eyebrow">Harsh / Admin</p><p className="mt-5 text-sm text-black/60">Loading secure dashboard…</p></main>;
  if (!user || !isAdmin) return <main className="wrap flex min-h-[75vh] items-center justify-center py-20"><section className="w-full max-w-md border border-black/10 bg-white p-8 md:p-10"><p className="eyebrow text-[#6B2638]">Private workspace</p><h1 className="serif mt-4 text-4xl">Admin sign in.</h1><p className="mt-3 text-sm leading-6 text-black/55">Sign in with the administrator account for the Harsh fashion portfolio.</p><form onSubmit={handleLogin} className="mt-8 space-y-6"><label className="block"><span className="eyebrow">Email address</span><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border-b border-black/25 bg-transparent py-3 outline-none focus:border-[#6B2638]" /></label><label className="block"><span className="eyebrow">Password</span><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border-b border-black/25 bg-transparent py-3 outline-none focus:border-[#6B2638]" /></label><button disabled={busy} className="w-full bg-[#6B2638] px-6 py-4 text-[10px] uppercase tracking-[.2em] text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button></form>{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}<p className="mt-8 text-xs leading-5 text-black/40">Administrator accounts are created privately in Supabase. Public sign-up is not available.</p></section></main>;

  const visibleItems = items.filter((item) => item.content_type === filter);
  return <main className="wrap min-h-[75vh] py-10 md:py-14">
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-black/10 pb-7"><div><p className="eyebrow text-[#6B2638]">Harsh / Private workspace</p><h1 className="serif mt-3 text-4xl md:text-5xl">Studio manager.</h1><p className="mt-3 text-sm text-black/55">Manage your portfolio content and contact enquiries.</p></div><button onClick={() => void handleLogout()} className="bg-[#171614] px-5 py-3 text-[10px] uppercase tracking-[.16em] text-white">Sign out</button></div>
    <div className="mt-7 flex flex-wrap gap-2"><button onClick={() => setTab("content")} className={tab === "content" ? "bg-[#6B2638] px-5 py-3 text-xs text-white" : "border border-black/20 px-5 py-3 text-xs"}>Portfolio content ({items.length})</button><button onClick={() => setTab("inbox")} className={tab === "inbox" ? "bg-[#6B2638] px-5 py-3 text-xs text-white" : "border border-black/20 px-5 py-3 text-xs"}>Enquiries ({messages.length})</button></div>
    {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-5 border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {tab === "content" ? <div className="mt-8 grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
      <section className="border border-black/10 bg-white p-6 md:p-8"><p className="eyebrow text-[#6B2638]">{editingId ? "Edit portfolio item" : "Add new content"}</p><h2 className="serif mt-3 text-3xl">{editingId ? "Update your story." : "Create something new."}</h2>
        <form onSubmit={saveContent} className="mt-7 space-y-4">
          <label className="block"><span className="eyebrow">Content section</span><select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })} className="mt-2 w-full border border-black/20 bg-white p-3 text-sm">{types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label className="block"><span className="eyebrow">Title *</span><input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="e.g. The New Heirloom" /></label>
          <label className="block"><span className="eyebrow">URL slug</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="the-new-heirloom" /></label>
          <label className="block"><span className="eyebrow">Description / details</span><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="Tell the story behind this work..." /></label>
          <label className="block"><span className="eyebrow">Image URL</span><input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="https://..." /><span className="mt-1 block text-xs text-black/45">Paste a publicly accessible image link. Direct file upload will be added after storage setup.</span></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><span className="eyebrow">Category</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="Occasionwear" /></label><label className="block"><span className="eyebrow">Year</span><input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="2026" /></label></div>
          <label className="block"><span className="eyebrow">Client / collaborator (optional)</span><input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" placeholder="Client or collaborator" /></label>
          <label className="block"><span className="eyebrow">Display order</span><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-2 w-full border border-black/20 p-3 text-sm" /></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 accent-[#6B2638]" /> Publish on the public website</label>
          <div className="flex flex-wrap gap-3"><button disabled={busy} className="bg-[#6B2638] px-6 py-4 text-[10px] uppercase tracking-[.16em] text-white disabled:opacity-50">{busy ? "Saving…" : editingId ? "Save changes" : "Add content"}</button>{editingId && <button type="button" onClick={resetForm} className="border border-black/20 px-6 py-4 text-[10px] uppercase tracking-[.16em]">Cancel edit</button>}</div>
        </form>
      </section>
      <section><div className="flex flex-wrap gap-2">{types.map((t) => <button key={t.value} onClick={() => setFilter(t.value)} className={filter === t.value ? "bg-[#171614] px-4 py-3 text-xs text-white" : "border border-black/20 px-4 py-3 text-xs"}>{t.label}</button>)}</div><div className="mt-5 space-y-3">{visibleItems.length === 0 ? <p className="border border-dashed border-black/20 p-7 text-sm text-black/50">No {types.find((t) => t.value === filter)?.label.toLowerCase()} added yet. Use the form to create your first item.</p> : visibleItems.map((item) => <article key={item.id} className="border border-black/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="serif text-2xl">{item.title}</h3><p className="mt-1 text-xs text-black/45">{item.category || item.content_type} {item.year ? "· " + item.year : ""}</p></div><span className={item.is_published ? "bg-green-50 px-3 py-1 text-[10px] uppercase tracking-wider text-green-800" : "bg-black/5 px-3 py-1 text-[10px] uppercase tracking-wider text-black/60"}>{item.is_published ? "Published" : "Draft"}</span></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-black/60">{item.description || "No description added."}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} onClick={() => startEdit(item)} className="border border-black/20 px-4 py-2 text-[10px] uppercase tracking-wider">Edit</button><button disabled={busy} onClick={() => void togglePublish(item)} className="border border-black/20 px-4 py-2 text-[10px] uppercase tracking-wider">{item.is_published ? "Unpublish" : "Publish"}</button><button disabled={busy} onClick={() => void deleteContent(item)} className="border border-red-200 px-4 py-2 text-[10px] uppercase tracking-wider text-red-700">Delete</button></div></article>)}</div></section>
    </div> : <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><section className="space-y-3"><h2 className="eyebrow mb-4">Inbox</h2>{messages.length === 0 ? <p className="border border-dashed border-black/20 p-8 text-sm text-black/50">No enquiries yet. Contact form submissions will appear here.</p> : messages.map((m) => <button key={m.id} onClick={() => setSelected(m)} className={selected?.id === m.id ? "block w-full border border-[#6B2638] bg-[#6B2638]/5 p-5 text-left" : "block w-full border border-black/10 p-5 text-left"}><strong className="text-sm">{m.name}</strong><span className="mt-1 block text-xs text-black/45">{m.email}</span><span className="mt-2 block text-sm text-black/65">{m.message}</span></button>)}</section><section className="min-h-64 border border-black/10 bg-white p-6 md:p-8"><p className="eyebrow text-[#6B2638]">Message details</p>{selected ? <><h2 className="serif mt-5 text-3xl">{selected.name}</h2><a className="mt-3 inline-block text-sm underline" href={`mailto:${selected.email}`}>{selected.email}</a><p className="mt-2 text-xs text-black/40">{new Date(selected.created_at).toLocaleString()}</p><div className="mt-8 whitespace-pre-wrap border-t border-black/10 pt-6 text-sm leading-7">{selected.message}</div><a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: Your enquiry to Harsh Studio")}`} className="mt-8 inline-block bg-[#6B2638] px-6 py-4 text-[10px] uppercase tracking-[.16em] text-white">Reply by email ↗</a></> : <p className="mt-6 text-sm text-black/50">Select an enquiry to read and reply.</p>}</section></div>}
    <p className="mt-10 border-t border-black/10 pt-5 text-xs leading-6 text-black/45">Tip: add a public image URL for each item. Save as a draft first, then publish when you are ready. Public pages show only published content.</p>
  </main>;
}
