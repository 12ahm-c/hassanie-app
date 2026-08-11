export interface MonoCleanResult {
  text: string;
  lines: string[];
  removedDuplicates: number;
  removedEmpty: number;
  removedShort: number;
  removedFus7a: number;
}

const fus7aWords = [
  "لذلك",
  "حيث",
  "بالتالي",
  "يمكن",
  "يجب",
  "من أجل",
  "لأن",
  "إلى",
  "على",
  "هذا",
  "هذه",
];

function cleanLine(line: string): string {
  return line
    .replace(/\[\d{1,2}\/\d{1,2}\/\d{2,4}.*?\]/g, "")
    .replace(/~\s*[^:]+:\s*/g, "")
    .replace(/http\S+|www\S+/g, "")
    .replace(/<.*?>/g, "")
    .replace(/\d+/g, "")
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanMonoSentences(input: string): MonoCleanResult {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  const seen = new Set<string>();
  const lines: string[] = [];
  let removedDuplicates = 0;
  let removedEmpty = 0;
  let removedShort = 0;
  let removedFus7a = 0;

  for (const rawLine of normalized.split("\n")) {
    const line = cleanLine(rawLine);

    if (!line) {
      removedEmpty += 1;
      continue;
    }

    if (line.split(/\s+/).length < 3) {
      removedShort += 1;
      continue;
    }

    if (fus7aWords.some((word) => line.includes(word))) {
      removedFus7a += 1;
      continue;
    }

    if (seen.has(line)) {
      removedDuplicates += 1;
      continue;
    }

    seen.add(line);
    lines.push(line);
  }

  return {
    text: lines.join("\n"),
    lines,
    removedDuplicates,
    removedEmpty,
    removedShort,
    removedFus7a,
  };
}
