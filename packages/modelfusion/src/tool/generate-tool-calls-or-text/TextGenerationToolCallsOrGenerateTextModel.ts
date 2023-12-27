import { FunctionOptions } from "../../core/FunctionOptions.js";
import { TextGenerationModel } from "../../model-function/generate-text/TextGenerationModel.js";
import { generateText } from "../../model-function/generate-text/generateText.js";
import { ToolDefinition } from "../ToolDefinition.js";
import { ToolCallsOrGenerateTextPromptTemplate } from "./ToolCallsOrGenerateTextPromptTemplate.js";
import {
  ToolCallsOrTextGenerationModel,
  ToolCallsOrTextGenerationModelSettings,
} from "./ToolCallsOrTextGenerationModel.js";
import { ToolCallsOrTextParseError } from "./ToolCallsOrTextParseError.js";

export class TextGenerationToolCallsOrGenerateTextModel<
  SOURCE_PROMPT,
  TARGET_PROMPT,
  MODEL extends TextGenerationModel<
    TARGET_PROMPT,
    ToolCallsOrTextGenerationModelSettings
  >,
> implements ToolCallsOrTextGenerationModel<SOURCE_PROMPT, MODEL["settings"]>
{
  private readonly model: MODEL;
  private readonly template: ToolCallsOrGenerateTextPromptTemplate<
    SOURCE_PROMPT,
    TARGET_PROMPT
  >;

  constructor({
    model,
    template,
  }: {
    model: MODEL;
    template: ToolCallsOrGenerateTextPromptTemplate<
      SOURCE_PROMPT,
      TARGET_PROMPT
    >;
  }) {
    this.model = model;
    this.template = template;
  }

  get modelInformation() {
    return this.model.modelInformation;
  }

  get settings() {
    return this.model.settings;
  }

  get settingsForEvent(): Partial<MODEL["settings"]> {
    return this.model.settingsForEvent;
  }

  async doGenerateToolCallsOrText(
    tools: Array<ToolDefinition<string, unknown>>,
    prompt: SOURCE_PROMPT,
    options?: FunctionOptions
  ) {
    const {
      response,
      text: generatedText,
      metadata,
    } = await generateText(
      this.model,
      this.template.createPrompt(prompt, tools),
      {
        ...options,
        fullResponse: true,
      }
    );

    try {
      const { text, toolCalls } =
        this.template.extractToolCallsAndText(generatedText);

      return {
        response,
        text,
        toolCalls,
        usage: metadata?.usage as
          | {
              promptTokens: number;
              completionTokens: number;
              totalTokens: number;
            }
          | undefined,
      };
    } catch (error) {
      throw new ToolCallsOrTextParseError({
        valueText: generatedText,
        cause: error,
      });
    }
  }

  withSettings(additionalSettings: Partial<MODEL["settings"]>): this {
    return new TextGenerationToolCallsOrGenerateTextModel({
      model: this.model.withSettings(additionalSettings),
      template: this.template,
    }) as this;
  }
}
