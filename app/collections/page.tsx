import { PageIntro } from "@/components/sections";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { getPortfolioItems } from "@/lib/portfolio";
export default async function Collections(){const items=await getPortfolioItems("collection");return <main><PageIntro kicker="03 / Collections" title="INDO-WESTERN COLLECTIONS." copy="A design language shaped by the meeting of Indian craft, contemporary silhouettes and expressive personal style."/><PortfolioGrid items={items} emptyLabel="New collections will appear here when you publish them from the studio admin dashboard."/></main>}
