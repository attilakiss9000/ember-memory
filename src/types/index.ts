export type AnnotationMode = "minimal" | "standard";

export type Authenticity = "genuine" | "performed" | "uncertain";

export type Confidence = "low" | "medium" | "high";

export type Weight = 1 | 2 | 3 | 4 | 5;

export type MessageRole = "user" | "assistant";

export type MinimalAnnotation = {
  weight: Weight;
  temperature: string;
};

export type StandardAnnotation = MinimalAnnotation & {
  authenticity: Authenticity;
  shift: boolean;
  subtext: string;
  unspoken: string;
  confidence: Confidence;
};

export type ConversationRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
};

export type MessageRow = {
  id: number;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type AnnotationRow = {
  id: number;
  message_id: number;
  temperature: string;
  authenticity: Authenticity | null;
  shift: number;
  subtext: string | null;
  weight: number;
  unspoken: string | null;
  confidence: Confidence | null;
  annotation_mode: AnnotationMode;
};

export type AnnotatedMessage = MessageRow & {
  annotation: AnnotationRow | null;
};

export type ConversationWithMoments = {
  conversation: ConversationRow;
  moments: AnnotatedMessage[];
};

export type EmberConfig = {
  annotation_mode: AnnotationMode;
};

export const DEFAULT_CONFIG: EmberConfig = {
  annotation_mode: "standard",
};

export const VALID_CONFIG_KEYS = ["annotation_mode"] as const;
export type ConfigKey = (typeof VALID_CONFIG_KEYS)[number];
