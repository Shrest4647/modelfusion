import {
  generateStructure,
  jsonStructurePrompt,
  ollama,
  zodSchema,
} from "modelfusion";
import { z } from "zod";

async function main() {
  const structure = await generateStructure({
    model: ollama
      .CompletionTextGenerator({
        model: "openhermes2.5-mistral",
        promptTemplate: ollama.prompt.ChatML,
        raw: true, // required when using custom prompt template
        maxGenerationTokens: 1024,
        temperature: 0,
        stopSequences: ["\n\n"], // prevent infinite generation
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
  });

  console.log(structure.characters);
}

main().catch(console.error);
