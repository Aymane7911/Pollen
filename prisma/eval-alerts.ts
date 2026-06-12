// Seeds a default alert rule + demo recipients, then runs the §9 alert evaluation so the
// map's alert-plume layer has data. Re-runnable (cooldown dedupe prevents duplicate alerts).
import { seedDefaultAlertConfig, evaluateAlerts } from "../src/lib/alerts";
import { prisma } from "../src/lib/db";

async function main() {
  await seedDefaultAlertConfig();
  const raised = await evaluateAlerts();
  const total = await prisma.alert.count();
  console.log(`Alert evaluation: raised ${raised} new alert(s); ${total} total alert(s) on record.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
