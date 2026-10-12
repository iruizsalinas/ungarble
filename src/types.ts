export interface ExplanationStep {
  action: "encode" | "decode" | "transcode" | "apply";
  detail: string;
}

export interface FixResult {
  text: string;
  steps: ExplanationStep[];
}
