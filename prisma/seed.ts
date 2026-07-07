import { PrismaClient } from "@prisma/client";
import { accountTypeTemplates } from "../src/data/accountTypeTemplates";

const prisma = new PrismaClient();

async function main() {
  const restaurantTypeKeys = accountTypeTemplates.map((template) => template.typeKey);

  await prisma.accountTypeTemplate.deleteMany({
    where: {
      typeKey: {
        notIn: restaurantTypeKeys
      }
    }
  });

  for (const template of accountTypeTemplates) {
    await prisma.accountTypeTemplate.upsert({
      where: { typeKey: template.typeKey },
      update: {
        name: template.name,
        defaultColumns: JSON.stringify(template.defaultColumns),
        weeklyRatio: JSON.stringify(template.weeklyRatio),
        imageStrategy: JSON.stringify(template.imageStrategy),
        titleStrategy: JSON.stringify(template.titleStrategy),
        coverStrategy: JSON.stringify(template.coverStrategy),
        interactionStrategy: JSON.stringify(template.interactionStrategy),
        commercializationPath: JSON.stringify(template.commercializationPath),
        riskRules: JSON.stringify(template.riskRules),
        promptRules: JSON.stringify(template.promptRules)
      },
      create: {
        typeKey: template.typeKey,
        name: template.name,
        defaultColumns: JSON.stringify(template.defaultColumns),
        weeklyRatio: JSON.stringify(template.weeklyRatio),
        imageStrategy: JSON.stringify(template.imageStrategy),
        titleStrategy: JSON.stringify(template.titleStrategy),
        coverStrategy: JSON.stringify(template.coverStrategy),
        interactionStrategy: JSON.stringify(template.interactionStrategy),
        commercializationPath: JSON.stringify(template.commercializationPath),
        riskRules: JSON.stringify(template.riskRules),
        promptRules: JSON.stringify(template.promptRules)
      }
    });
  }

  await prisma.setting.upsert({
    where: { key: "mode" },
    update: { value: "prompt_command_only" },
    create: { key: "mode", value: "prompt_command_only" }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
