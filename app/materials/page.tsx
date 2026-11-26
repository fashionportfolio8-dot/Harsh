import { PageIntro } from "@/components/sections";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { getPortfolioItems } from "@/lib/portfolio";
export default async function Materials(){const items=await getPortfolioItems("material");return <main><PageIntro kicker="06 / Material archive" title="The beauty is in the detail." copy="A tactile archive of textiles, colour, surface and craft. A place for the materials that shape each design story."/><PortfolioGrid items={items} emptyLabel="Your published materials and textile studies will appear here."/></main>}
