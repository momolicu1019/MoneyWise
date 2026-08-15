import type { CloudPayload } from '../types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'moneywise-data.json';

function formatDriveError(status: number, text: string): Error {
  let message = text;
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; status?: string };
      error_description?: string;
    };
    message = parsed.error?.message || parsed.error_description || text;
  } catch {
    message = text;
  }

  if (status === 401) {
    return new Error('Google session expired. Log out and sign in again.');
  }
  if (status === 403 || /insufficient|scope/i.test(message)) {
    return new Error(
      'MoneyWise does not have Google Drive permission. Log out, sign in again, and allow Drive access.',
    );
  }
  return new Error(message || `Drive request failed (${status})`);
}

async function authorizedJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw formatDriveError(response.status, text);
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

export async function findDriveFileId(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FILE_NAME}'`);
  const data = await authorizedJson<{ files?: { id: string }[] }>(
    `${DRIVE_API}/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`,
    token,
  );
  return data.files?.[0]?.id ?? null;
}

export async function downloadDrivePayload(token: string, fileId: string): Promise<CloudPayload> {
  return authorizedJson<CloudPayload>(`${DRIVE_API}/files/${fileId}?alt=media`, token);
}

export async function uploadDrivePayload(
  token: string,
  payload: CloudPayload,
  fileId?: string | null,
): Promise<string> {
  const metadata = fileId
    ? { name: FILE_NAME }
    : { name: FILE_NAME, parents: ['appDataFolder'] };
  const boundary = 'moneywise_boundary';
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const url = fileId
    ? `${UPLOAD_API}/files/${fileId}?uploadType=multipart`
    : `${UPLOAD_API}/files?uploadType=multipart`;

  const data = await authorizedJson<{ id: string }>(url, token, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  return data.id;
}

export async function pullFromDrive(token: string): Promise<CloudPayload | null> {
  const fileId = await findDriveFileId(token);
  if (!fileId) return null;
  return downloadDrivePayload(token, fileId);
}

export async function pushToDrive(token: string, payload: CloudPayload): Promise<void> {
  const fileId = await findDriveFileId(token);
  await uploadDrivePayload(token, payload, fileId);
}

export function formatSyncError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Drive sync failed. Log out and sign in again.';
}
