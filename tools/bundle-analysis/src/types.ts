export interface LambdaBundleInfo {
  name: string;
  totalBytes: number;
  files: Map<string, number>; // file path → byte size
}

export type ChangeStatus = "increased" | "decreased" | "unchanged" | "new" | "removed";

export interface BundleComparison {
  name: string;
  baselineBytes: number | undefined;
  currentBytes: number | undefined;
  absoluteChange: number | undefined;
  percentageChange: number | undefined;
  status: ChangeStatus;
}

export interface AnalysisResult {
  comparisons: BundleComparison[];
  baselineDir: string;
  currentDir: string;
}

export interface AnalysisOptions {
  baselineDir: string;
  currentDir: string;
  outputDir: string;
  threshold: number;
}
