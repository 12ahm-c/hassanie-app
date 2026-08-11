const HF_API_BASE = "https://huggingface.co/api";
const DEFAULT_DATASET_FILE = "data/train-00000-of-00001.parquet";

interface HFConfig {
  token: string;
  repo: string;
}

type DatasetRow = { arabic: string; hassani: string };
type MonoDatasetRow = { text: string };
type QaDatasetRow = { question: string; answer: string };

export class HuggingFaceService {
  private token: string;
  private repo: string;

  constructor(config?: HFConfig) {
    this.token = config?.token || process.env.HUGGINGFACE_TOKEN || "";
    this.repo = config?.repo || process.env.HUGGINGFACE_REPO || "";
  }

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` };
  }

  async downloadDataset(): Promise<string> {
    try {
      const allRows: DatasetRow[] = [];

      const treeRes = await fetch(`${HF_API_BASE}/datasets/${this.repo}/tree/main`, {
        headers: this.headers(),
      });
      if (treeRes.ok) {
        const files: { path: string; type: string }[] = await treeRes.json();

        for (const file of files) {
          if (file.path.startsWith("data/") && file.path.endsWith(".parquet")) {
            const rows = await this.downloadParquet(file.path);
            allRows.push(...rows);
          }
        }

        const dataFolders = files.filter((f) => f.type === "directory" || f.path.endsWith("/"));
        for (const folder of dataFolders) {
          const folderPath = folder.path.replace(/\/$/, "");
          const subTreeRes = await fetch(
            `${HF_API_BASE}/datasets/${this.repo}/tree/main/${folderPath}`,
            { headers: this.headers() }
          );
          if (subTreeRes.ok) {
            const subFiles: { path: string }[] = await subTreeRes.json();
            for (const subFile of subFiles) {
              if (subFile.path.startsWith("data/") && subFile.path.endsWith(".parquet")) {
                const rows = await this.downloadParquet(subFile.path);
                allRows.push(...rows);
              }
            }
          }
        }
      }

      if (allRows.length === 0) return "";

      const seen = new Set<string>();
      const unique: DatasetRow[] = [];
      for (const row of allRows) {
        const normalized = this.normalizeRow(row);
        const key = this.rowKey(normalized);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(normalized);
        }
      }

      return unique.map((r) => JSON.stringify(r)).join("\n");
    } catch {
      return "";
    }
  }

  private async downloadParquet(path: string): Promise<DatasetRow[]> {
    try {
      const url = `https://huggingface.co/datasets/${this.repo}/resolve/main/${path}`;
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) return [];

      const buf = new Uint8Array(await res.arrayBuffer());

      const { readParquet } = await import("parquet-wasm/node");
      const { tableFromIPC } = await import("apache-arrow");

      const pqTable = readParquet(buf);
      const ipcStream = pqTable.intoIPCStream();
      const arrowTable = tableFromIPC(ipcStream);

      const rows: DatasetRow[] = [];
      for (let i = 0; i < arrowTable.numRows; i++) {
        const row = arrowTable.get(i);
        const obj = row?.toJSON?.() ?? row;
        const arabic = (obj as any)?.arabic;
        const hassani = (obj as any)?.hassani ?? (obj as any)?.hassaniya;
        if (arabic && hassani) {
          rows.push({ arabic: String(arabic).trim(), hassani: String(hassani).trim() });
        }
      }
      return rows;    } catch (e: any) {
      return [];
    }
  }

  async downloadMonoDataset(): Promise<string> {
    try {
      const allRows: MonoDatasetRow[] = [];

      const treeRes = await fetch(`${HF_API_BASE}/datasets/${this.repo}/tree/main`, {
        headers: this.headers(),
      });
      if (!treeRes.ok) return "";

      const files: { path: string; type: string }[] = await treeRes.json();
      for (const file of files) {
        if (file.path.startsWith("data/") && file.path.endsWith(".parquet")) {
          const rows = await this.downloadMonoParquet(file.path);
          allRows.push(...rows);
        }
      }

      const seen = new Set<string>();
      const unique: MonoDatasetRow[] = [];
      for (const row of allRows) {
        const text = String(row.text).trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          unique.push({ text });
        }
      }

      return unique.map((row) => JSON.stringify(row)).join("\n");
    } catch {
      return "";
    }
  }

  private async downloadMonoParquet(path: string): Promise<MonoDatasetRow[]> {
    try {
      const url = `https://huggingface.co/datasets/${this.repo}/resolve/main/${path}`;
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) return [];

      const buf = new Uint8Array(await res.arrayBuffer());

      const { readParquet } = await import("parquet-wasm/node");
      const { tableFromIPC } = await import("apache-arrow");

      const pqTable = readParquet(buf);
      const ipcStream = pqTable.intoIPCStream();
      const arrowTable = tableFromIPC(ipcStream);

      const rows: MonoDatasetRow[] = [];
      for (let i = 0; i < arrowTable.numRows; i++) {
        const row = arrowTable.get(i);
        const obj = row?.toJSON?.() ?? row;
        const text = (obj as any)?.text ?? (obj as any)?.sentence;
        if (text) rows.push({ text: String(text).trim() });
      }

      return rows;
    } catch {
      return [];
    }
  }

  private async downloadJsonl(path: string): Promise<DatasetRow[]> {
    try {
      const url = `https://huggingface.co/datasets/${this.repo}/resolve/main/${path}`;
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) return [];

      const text = await res.text();
      let decoded: string;
      const trimmed = text.trim();
      if (trimmed.startsWith("{")) {
        decoded = trimmed;
      } else {
        decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      }

      return this.parseDatasetRows(decoded);
    } catch {
      return [];
    }
  }

  async uploadDataset(
    content: string,
    filename: string = DEFAULT_DATASET_FILE,
    commitMessage: string = "Update dataset"
  ): Promise<void> {
    const { uploadFile } = await import("@huggingface/hub");
    const parquet = await this.encodeParquet(content);
    const parquetBuffer = parquet.buffer.slice(
      parquet.byteOffset,
      parquet.byteOffset + parquet.byteLength
    ) as ArrayBuffer;

    await uploadFile({
      repo: { type: "dataset", name: this.repo },
      accessToken: this.token,
      file: {
        path: filename,
        content: new Blob([parquetBuffer], { type: "application/octet-stream" }),
      },
      commitTitle: commitMessage,
    });
  }

  async uploadMonoDataset(
    content: string,
    filename?: string,
    commitMessage: string = "Update mono dataset"
  ): Promise<void> {
    if (!filename) {
      const now = new Date();
      const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      filename = `data/uploads/mono-${ts}.parquet`;
    }
    const { uploadFile } = await import("@huggingface/hub");
    const parquet = await this.encodeMonoParquet(content);
    const parquetBuffer = parquet.buffer.slice(
      parquet.byteOffset,
      parquet.byteOffset + parquet.byteLength
    ) as ArrayBuffer;

    await uploadFile({
      repo: { type: "dataset", name: this.repo },
      accessToken: this.token,
      file: {
        path: filename,
        content: new Blob([parquetBuffer], { type: "application/octet-stream" }),
      },
      commitTitle: commitMessage,
    });
  }

  mergeDatasets(existing: string, newData: string): string {
    const existingRows = this.parseDatasetRows(existing);
    const newRows = this.parseDatasetRows(newData);

    const merged = [...existingRows];
    const seen = new Set(
      existingRows.map((row) => this.rowKey(row))
    );

    for (const row of newRows) {
      const key = this.rowKey(row);
      if (!seen.has(key)) {
        merged.push(row);
        seen.add(key);
      }
    }

    return merged.map((row) => JSON.stringify(row)).join("\n");
  }

  mergeMonoDatasets(existing: string, newData: string): string {
    const existingRows = this.parseMonoRows(existing);
    const newRows = this.parseMonoRows(newData);
    const merged = [...existingRows];
    const seen = new Set(existingRows.map((row) => row.text.trim()));

    for (const row of newRows) {
      const key = row.text.trim();
      if (key && !seen.has(key)) {
        merged.push(row);
        seen.add(key);
      }
    }

    return merged.map((row) => JSON.stringify(row)).join("\n");
  }

  parseDatasetRows(content: string): DatasetRow[] {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => this.normalizeRow(JSON.parse(line)));
  }

  countDatasetRows(content: string): number {
    return this.parseDatasetRows(content).length;
  }

  parseMonoRows(content: string): MonoDatasetRow[] {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parsed = JSON.parse(line);
        return { text: String(parsed.text ?? parsed.sentence ?? "").trim() };
      })
      .filter((row) => row.text);
  }

  countMonoRows(content: string): number {
    return this.parseMonoRows(content).length;
  }

  getExistingMonoKeys(content: string): Set<string> {
    return new Set(this.parseMonoRows(content).map((row) => row.text.trim()));
  }

  getExistingKeys(content: string): Set<string> {
    return new Set(this.parseDatasetRows(content).map((row) => this.rowKey(row)));
  }

  rowKey(row: DatasetRow): string {
    return `${row.arabic.trim()}|||${row.hassani.trim()}`;
  }

  async downloadQaDataset(): Promise<string> {
    try {
      const allRows: QaDatasetRow[] = [];
      const repo = this.repo;

      const treeRes = await fetch(
        `${HF_API_BASE}/datasets/${repo}/tree/main`,
        { headers: this.headers() }
      );
      if (treeRes.ok) {
        const files: { path: string; type: string }[] = await treeRes.json();
        for (const file of files) {
          if (file.path.startsWith("data/") && file.path.endsWith(".parquet")) {
            const rows = await this.downloadQaParquet(file.path);
            allRows.push(...rows);
          }
        }
      }

      if (allRows.length === 0) return "";

      const seen = new Set<string>();
      const unique: QaDatasetRow[] = [];
      for (const row of allRows) {
        const key = `${row.question.trim()}|||${row.answer.trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(row);
        }
      }

      return unique.map((r) => JSON.stringify(r)).join("\n");
    } catch {
      return "";
    }
  }

  private async downloadQaParquet(path: string): Promise<QaDatasetRow[]> {
    try {
      const url = `https://huggingface.co/datasets/${this.repo}/resolve/main/${path}`;
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) return [];

      const buf = new Uint8Array(await res.arrayBuffer());
      const { readParquet } = await import("parquet-wasm/node");
      const { tableFromIPC } = await import("apache-arrow");

      const pqTable = readParquet(buf);
      const ipcStream = pqTable.intoIPCStream();
      const arrowTable = tableFromIPC(ipcStream);

      const rows: QaDatasetRow[] = [];
      for (let i = 0; i < arrowTable.numRows; i++) {
        const row = arrowTable.get(i);
        const obj = row?.toJSON?.() ?? row;
        const question = (obj as any)?.question;
        const answer = (obj as any)?.answer;
        if (question && answer) {
          rows.push({
            question: String(question).trim(),
            answer: String(answer).trim(),
          });
        }
      }
      return rows;
    } catch {
      return [];
    }
  }

  mergeQaDatasets(existing: string, newData: string): string {
    const existingRows = this.parseQaRows(existing);
    const newRows = this.parseQaRows(newData);
    const merged = [...existingRows];
    const seen = new Set(
      existingRows.map((r) => `${r.question.trim()}|||${r.answer.trim()}`)
    );

    for (const row of newRows) {
      const key = `${row.question.trim()}|||${row.answer.trim()}`;
      if (key && !seen.has(key)) {
        merged.push(row);
        seen.add(key);
      }
    }

    return merged.map((row) => JSON.stringify(row)).join("\n");
  }

  parseQaRows(content: string): QaDatasetRow[] {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parsed = JSON.parse(line);
        return {
          question: String(parsed.question ?? "").trim(),
          answer: String(parsed.answer ?? "").trim(),
        };
      })
      .filter((row) => row.question && row.answer);
  }

  getExistingQaKeys(content: string): Set<string> {
    return new Set(
      this.parseQaRows(content).map(
        (r) => `${r.question.trim()}|||${r.answer.trim()}`
      )
    );
  }

  async uploadQaDataset(
    content: string,
    filename?: string,
    commitMessage: string = "Update QA dataset"
  ): Promise<void> {
    if (!filename) {
      const now = new Date();
      const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      filename = `data/uploads/qa-${ts}.parquet`;
    }
    const { uploadFile } = await import("@huggingface/hub");
    const rows = this.parseQaRows(content);

    const { tableFromArrays, tableToIPC } = await import("apache-arrow");
    const { Table, writeParquet } = await import("parquet-wasm/node");

    const arrowTable = tableFromArrays({
      question: rows.map((r) => r.question),
      answer: rows.map((r) => r.answer),
    });
    const wasmTable = Table.fromIPCStream(
      tableToIPC(arrowTable, "stream")
    );
    const parquet = await writeParquet(wasmTable);
    const parquetBuffer = parquet.buffer.slice(
      parquet.byteOffset,
      parquet.byteOffset + parquet.byteLength
    ) as ArrayBuffer;

    await uploadFile({
      repo: { type: "dataset", name: this.repo },
      accessToken: this.token,
      file: {
        path: filename,
        content: new Blob([parquetBuffer], {
          type: "application/octet-stream",
        }),
      },
      commitTitle: commitMessage,
    });
  }

  private normalizeRow(row: DatasetRow): DatasetRow {
    return {
      arabic: String(row.arabic).trim(),
      hassani: String(row.hassani).trim(),
    };
  }

  private async encodeParquet(content: string): Promise<Uint8Array> {
    const rows = this.parseDatasetRows(content);
    const { tableFromArrays, tableToIPC } = await import("apache-arrow");
    const { Table, writeParquet } = await import("parquet-wasm/node");

    const arrowTable = tableFromArrays({
      arabic: rows.map((row) => row.arabic),
      hassani: rows.map((row) => row.hassani),
    });
    const wasmTable = Table.fromIPCStream(tableToIPC(arrowTable, "stream"));
    return writeParquet(wasmTable);
  }

  private async encodeMonoParquet(content: string): Promise<Uint8Array> {
    const rows = this.parseMonoRows(content);
    const { tableFromArrays, tableToIPC } = await import("apache-arrow");
    const { Table, writeParquet } = await import("parquet-wasm/node");

    const arrowTable = tableFromArrays({
      text: rows.map((row) => row.text),
    });
    const wasmTable = Table.fromIPCStream(tableToIPC(arrowTable, "stream"));
    return writeParquet(wasmTable);
  }
}
