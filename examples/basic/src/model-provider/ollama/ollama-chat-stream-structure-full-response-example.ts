import {
  jsonStructurePrompt,
  ollama,
  streamStructure,
  zodSchema,
} from "modelfusion";
import { z } from "zod";

async function main() {
  const { structureStream, structurePromise } = await streamStructure({
    model: ollama
      .ChatTextGenerator({
        model: "openhermes2.5-mistral",
        maxGenerationTokens: 1024,
        temperature: 0,
      })
      .asStructureGenerationModel(jsonStructurePrompt.text()),

    schema: zodSchema(
      z.object({
        characters: z.array(
          z.object({
            name: z.string(),
            class: z
              .string()
              .describe("Character class, e.g. warrior, mage, or thief."),
            description: z.string(),
          })
        ),
      })
    ),

    prompt:
      "Generate 3 character descriptions for a fantasy role playing game.",

    fullResponse: true,
  });

  for await (const partialStructure of structureStream) {
    console.clear();
    console.log(partialStructure);
  }

  const structure = await structurePromise;

  console.clear();
  console.log("FINAL STRUCTURE");
  console.log(structure);
}

main().catch(console.error);
