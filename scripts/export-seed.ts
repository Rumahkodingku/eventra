import { mkdirSync, writeFileSync } from "node:fs";
import { seedData } from "../apps/web/src/data/seed/index";

mkdirSync("apps/api/seed", { recursive: true });
writeFileSync(
  "apps/api/seed/catalog.json",
  `${JSON.stringify(
    {
      categories: seedData.categories,
      venues: seedData.venues,
      organizers: seedData.organizers,
      events: seedData.events,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Exported ${seedData.events.length} events, ${seedData.categories.length} categories, ${seedData.venues.length} venues.`,
);
