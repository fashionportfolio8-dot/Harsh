import { createClient } from "@supabase/supabase-js";
export type PortfolioItem = { id:string; content_type:"collection"|"project"|"sketch"|"material"|"about"; title:string; slug:string; description:string; image_url:string|null; category:string|null; client:string|null; year:string|null; sort_order:number; is_published:boolean; created_at:string };
export async function getPortfolioItems(type: PortfolioItem["content_type"]): Promise<PortfolioItem[]> {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key) return [];
 const client=createClient(url,key);
 const {data,error}=await client.from("portfolio_items").select("*").eq("content_type",type).eq("is_published",true).order("sort_order").order("created_at",{ascending:false});
 if(error){console.error("Portfolio content query failed:",error.message);return [];} return (data??[]) as PortfolioItem[];
}
