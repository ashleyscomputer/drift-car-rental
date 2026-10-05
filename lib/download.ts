/** Save a browser download and release its temporary object URL. */
export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveFile(name: string, content: string, type: string) {
  saveBlob(name, new Blob([content], { type }));
}

export async function downloadPdf(url: string, filename: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error || 'Document could not be downloaded.');
  }
  saveBlob(filename, await response.blob());
}
