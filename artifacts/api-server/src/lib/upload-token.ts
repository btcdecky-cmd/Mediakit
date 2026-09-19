export interface SignedUpload {
  signature: string;
  expires: number;
  folder: string;
}

const DEFAULT_USER_AGENT = "mediakit-openinary/1.0.0";

export async function signUpload(
  baseUrl: string,
  apiKey: string,
  options: { folder?: string; expiresIn?: number } = {},
): Promise<SignedUpload> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/upload/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": DEFAULT_USER_AGENT,
    },
    body: JSON.stringify(options),
  });

  type SignResponse = { success?: boolean; signature?: string; expires?: number; folder?: string; error?: string };
  let body: SignResponse = {};
  try {
    body = await response.json() as SignResponse;
  } catch {
    body = {};
  }

  if (!response.ok || !body.success || !body.signature || !body.expires || !body.folder) {
    throw new Error(body.error ?? `Failed to sign upload (HTTP ${response.status})`);
  }

  return { signature: body.signature, expires: body.expires, folder: body.folder };
}
