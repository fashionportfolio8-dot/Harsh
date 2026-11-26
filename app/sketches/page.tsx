import { PageIntro } from "@/components/sections";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { getPortfolioItems } from "@/lib/portfolio";
export default async function Sketches(){const items=await getPortfolioItems("sketch");return <main><PageIntro kicker="05 / The process" title="From first line to final form." copy="An open notebook of silhouettes, garment studies and visual experiments."/><PortfolioGrid items={items} emptyLabel="Your published sketches and illustrations will appear here."/></main>}
