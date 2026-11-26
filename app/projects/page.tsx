import { PageIntro } from "@/components/sections";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { getPortfolioItems } from "@/lib/portfolio";
export default async function Projects(){const items=await getPortfolioItems("project");return <main><PageIntro kicker="04 / Selected work" title="Ideas made tangible." copy="A selection of creative explorations, concept development and fashion-led projects."/><PortfolioGrid items={items} emptyLabel="Published projects will appear here. Add your work through the studio admin dashboard."/></main>}
