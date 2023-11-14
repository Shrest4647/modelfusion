import dotenv from "dotenv";
import {
  OllamaTextGenerationModel,
  StructureDefinition,
  StructureFromTextGenerationModel,
  ZodSchema,
  parseJSON,
  useTool,
} from "modelfusion";
import { z } from "zod";
import { calculator } from "../../tool/calculator-tool";

dotenv.config();

// schema for prompt
const FunctionSchema = new ZodSchema(
  z.object({
    function: z.string(),
    params: z.any(),
  })
);

class CalculatorFunctionPromptFormat<STRUCTURE> {
  createPrompt(
    instruction: string,
    structure: StructureDefinition<any, STRUCTURE>
  ): string {
    // map parameters JSON schema
    const properties: Record<string, { type: string; description: string }> = (
      structure.schema.getJsonSchema() as any
    ).properties;
    return [
      `As an AI assistant, please select the most suitable function and parameters ` +
        `from the list of available functions below, based on the user's input. ` +
        `Provide your response in JSON format.`,
      ``,
      `Available functions:`,
      `${structure.name}:`,
      `  description: ${structure.description ?? ""}`,
      `  params:`,
      // Note: Does support nested schemas yet
      ...Object.entries(properties).map(
        ([name, { type, description }]) =>
          `    ${name}: (${type}) ${description}`
      ),
      ``,
      `Input: ${instruction}`,
      ``,
    ].join("\n");
  }

  extractStructure(response: string): unknown {
    const json = parseJSON({ text: response, schema: FunctionSchema });
    return json.params;
  }
}

async function main() {
  const { tool, parameters, result } = await useTool(
    new StructureFromTextGenerationModel({
      model: new OllamaTextGenerationModel({
        model: "mistral",
        format: "json",
        temperature: 0,
      }),
      format: new CalculatorFunctionPromptFormat(),
    }),
    calculator,
    "What's fourteen times twelve?"
  );

  console.log(`Tool: ${tool}`);
  console.log(`Parameters: ${JSON.stringify(parameters)}`);
  console.log(`Result: ${result}`);
}

main().catch(console.error);
