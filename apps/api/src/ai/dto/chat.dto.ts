import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsEnum(['system', 'user', 'assistant'])
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  content!: string;
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

  @IsString()
  @IsOptional()
  responseStyle?: string;

  @IsString()
  @IsOptional()
  responseLanguage?: string;

  @IsBoolean()
  @IsOptional()
  useEmoji?: boolean;

  @IsBoolean()
  @IsOptional()
  enableStreaming?: boolean;

  @IsBoolean()
  @IsOptional()
  enableSuggestions?: boolean;

  @IsBoolean()
  @IsOptional()
  enableContextMemory?: boolean;

  @IsBoolean()
  @IsOptional()
  enableAutoSave?: boolean;

  @IsBoolean()
  @IsOptional()
  saveConversations?: boolean;

  @IsBoolean()
  @IsOptional()
  shareForTraining?: boolean;

  @IsBoolean()
  @IsOptional()
  anonymizeData?: boolean;

  @IsString()
  @IsOptional()
  defaultAgent?: string;
}
