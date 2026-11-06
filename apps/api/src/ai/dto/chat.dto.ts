import { IsIn, IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IsStrictBoolean } from '../../common/strict-boolean';

export class ChatMessageDto {
  /**
   * `tool` is accepted so a confirmed tool call can report its result in the
   * history of the next turn. The server never fabricates one: it only ever
   * arrives from a client that performed the action the user confirmed.
   */
  @IsEnum(['system', 'user', 'assistant', 'tool'])
  role!: 'system' | 'user' | 'assistant' | 'tool';

  @IsString()
  content!: string;

  /** The declared capability this result belongs to. */
  @IsString()
  @IsOptional()
  toolName?: string;
}

export class ChatRequestDto {
  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @IsOptional()
  history?: ChatMessageDto[];

  @IsOptional()
  context?: Record<string, any>;

  /**
   * Offer the model the function-calling catalogue for this turn.
   *
   * Opt-in, and off by default, so a turn that does not ask for it produces
   * byte-identical requests to before tools existed. Not every model served by
   * Ollama supports them, and silently adding a `tools` field to every request
   * would change behaviour for deployments that never asked. Turning the
   * default on is a decision for whenever a tool-capable model is the
   * configured one.
   */
  @IsStrictBoolean()
  @IsOptional()
  enableTools?: boolean;
}

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  initialMessage?: string;
}

export class UpdateAIPreferencesDto {
  @IsString()
  @IsOptional()
  preferredModel?: string;

  @IsString()
  @IsOptional()
  preferredProvider?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  // The four /settings/ai offers; anything else would be stored and then
  // ignored by every answer (docs §98).
  @IsIn(['concise', 'detailed', 'casual', 'formal'])
  @IsOptional()
  responseStyle?: string;

  @IsString()
  @IsOptional()
  responseLanguage?: string;

  @IsStrictBoolean()
  @IsOptional()
  useEmoji?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  enableStreaming?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  enableSuggestions?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  enableContextMemory?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  enableAutoSave?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  saveConversations?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  shareForTraining?: boolean;

  @IsStrictBoolean()
  @IsOptional()
  anonymizeData?: boolean;

  @IsString()
  @IsOptional()
  defaultAgent?: string;
}
