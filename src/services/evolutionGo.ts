export interface EvolutionResponse {
  success:    boolean;
  data?:      unknown;
  error?:     string;
  httpStatus?: number;
  urlCalled?: string;
}

/* ── Helper genérico ── */
async function callApi(
  method:       'GET' | 'POST' | 'DELETE' | 'PUT',
  path:         string,
  body?:        object,
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  const baseUrl = (overrideUrl || '').replace(/\/$/, '');
  const apiKey  = overrideKey || '';

  if (!baseUrl) return { success: false, error: 'URL EvoGo não configurada.' };
  if (!apiKey)  return { success: false, error: 'Chave da API (apikey) não configurada.' };

  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': apiKey,
  };

  console.log(`[EvoGo] ▶ ${method} ${url}`);
  if (body && Object.keys(body).length > 0) console.log('[EvoGo] Body:', JSON.stringify(body));

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 15_000);

  try {
    const r = await fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const rawBody = await r.text();
    console.log(`[EvoGo] ◀ HTTP ${r.status}`, rawBody.slice(0, 600));

    let data: unknown;
    try { data = JSON.parse(rawBody); } catch { data = rawBody; }

    const d = data as Record<string, unknown> | null;
    const errorMsg = !r.ok
      ? ((d?.message as string) || (d?.error as string) || `Erro HTTP ${r.status}`)
      : undefined;

    return {
      success:    r.ok,
      data,
      httpStatus: r.status,
      urlCalled:  `${method} ${url}`,
      ...(errorMsg ? { error: errorMsg } : {}),
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const msg = (err as Error).name === 'AbortError'
      ? 'Timeout: sem resposta em 15s'
      : (err as Error).message;
    console.error('[EvoGo] ✖', msg);
    return { success: false, error: msg, urlCalled: `${method} ${url}` };
  }
}

/* ── 1. Listar todas as instâncias ───────────────────────────────────
   GET /instance/all   |  Header: apikey: GLOBAL_API_KEY
*/
export async function getAllInstances(
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  return callApi('GET', '/instance/all', undefined, overrideUrl, overrideKey);
}

/* ── 2. Criar instância ──────────────────────────────────────────────
   POST /instance/create  |  Header: apikey: GLOBAL_API_KEY
   Body: { name, token? }
*/
export async function createInstance(
  instanceName: string,
  token?:       string,
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  return callApi(
    'POST',
    '/instance/create',
    { name: instanceName, token: token || '' },
    overrideUrl,
    overrideKey,
  );
}

/* ── 3. Conectar instância ───────────────────────────────────────────
   POST /instance/connect  |  Header: apikey: <token da instância>
*/
export async function connectInstance(
  instanceToken: string,
  overrideUrl?:  string,
  opts?: {
    immediate?:       boolean;
    phone?:           string;
    subscribe?:       string[];
    webhookUrl?:      string;
    rabbitmqEnable?:  string;
    websocketEnable?: string;
    natsEnable?:      string;
  },
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para conexão.' };
  }
  return callApi(
    'POST',
    '/instance/connect',
    opts ?? {},
    overrideUrl,
    instanceToken,
  );
}

/* ── 4. Obter QR Code ────────────────────────────────────────────────
   GET /instance/qr  |  Header: apikey: <token da instância>
   Retorna: data.Qrcode (base64 PNG), data.Code (pairing)
*/
export async function getQrCode(
  instanceToken: string,
  overrideUrl?:  string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para buscar QR Code.' };
  }
  return callApi('GET', '/instance/qr', undefined, overrideUrl, instanceToken);
}

/* ── 5. Status da instância ──────────────────────────────────────────
   GET /instance/status  |  Header: apikey: <token da instância>
*/
export async function getInstanceStatus(
  instanceToken: string,
  overrideUrl?:  string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para verificar status.' };
  }
  return callApi('GET', '/instance/status', undefined, overrideUrl, instanceToken);
}

/* ── 6. Desconectar instância ────────────────────────────────────────
   POST /instance/disconnect  |  Header: apikey: <token da instância>
*/
export async function disconnectInstance(
  instanceToken: string,
  overrideUrl?:  string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para desconectar.' };
  }
  return callApi('POST', '/instance/disconnect', {}, overrideUrl, instanceToken);
}

/* ── 7. Logout da instância ──────────────────────────────────────────
   DELETE /instance/logout  |  Header: apikey: <token da instância>
*/
export async function logoutInstance(
  instanceToken: string,
  overrideUrl?:  string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para logout.' };
  }
  return callApi('DELETE', '/instance/logout', undefined, overrideUrl, instanceToken);
}

/* ── 8. Solicitar código de pareamento ───────────────────────────────
   POST /instance/pair  |  Header: apikey: <token da instância>
*/
export async function pairInstance(
  instanceToken: string,
  phone:         string,
  subscribe?:    string[],
  overrideUrl?:  string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido para pair.' };
  }
  if (!phone) {
    return { success: false, error: 'Número de telefone é obrigatório para pair.' };
  }
  return callApi(
    'POST',
    '/instance/pair',
    { phone, ...(subscribe ? { subscribe } : {}) },
    overrideUrl,
    instanceToken,
  );
}

/* ── 9. Foto de perfil da instância ─────────────────────────────────
   GET /user/profilePicture  |  Header: apikey: <token da instância>
*/
export async function getProfilePicture(
  instanceToken: string,
  overrideUrl?: string,
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token não fornecido.' };
  }
  return callApi('GET', '/user/profilePicture', undefined, overrideUrl, instanceToken);
}

/* ── 10. Reconnect instância (atualiza webhook) ──────────────────────
   POST /instance/reconnect  |  Header: apikey: <token da instância>
   Body: ConnectStruct (webhookUrl, subscribe, rabbitmqEnable, websocketEnable, natsEnable)
*/
export async function reconnectInstance(
  instanceToken: string,
  overrideUrl?:  string,
  opts?: {
    webhookUrl?:      string;
    subscribe?:       string[];
    rabbitmqEnable?:  string;
    websocketEnable?: string;
    natsEnable?:      string;
  },
): Promise<EvolutionResponse> {
  if (!instanceToken) {
    return { success: false, error: 'Token da instância não fornecido.' };
  }
  return callApi('POST', '/instance/reconnect', opts ?? {}, overrideUrl, instanceToken);
}

/* ── 11. Buscar configurações avançadas da instância ─────────────────
   GET /instance/{instanceId}/advanced-settings  |  Header: apikey: GLOBAL_API_KEY
*/
export async function getAdvancedSettings(
  instanceUuid: string,
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  return callApi(
    'GET',
    `/instance/${encodeURIComponent(instanceUuid)}/advanced-settings`,
    undefined,
    overrideUrl,
    overrideKey,
  );
}

/* ── 12. Atualizar configurações avançadas da instância ──────────────
   PUT /instance/{instanceId}/advanced-settings  |  Header: apikey: GLOBAL_API_KEY
   Body: AdvancedSettings { alwaysOnline, rejectCall, readMessages, ignoreGroups, ignoreStatus, msgRejectCall }
*/
export async function updateAdvancedSettings(
  instanceUuid: string,
  settings: {
    alwaysOnline?:  boolean;
    rejectCall?:    boolean;
    readMessages?:  boolean;
    ignoreGroups?:  boolean;
    ignoreStatus?:  boolean;
    msgRejectCall?: string;
  },
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  return callApi(
    'PUT',
    `/instance/${encodeURIComponent(instanceUuid)}/advanced-settings`,
    settings,
    overrideUrl,
    overrideKey,
  );
}

/* ── 13. Deletar instância ───────────────────────────────────────────
   DELETE /instance/delete/{instanceId}  |  Header: apikey: GLOBAL_API_KEY
*/
export async function deleteInstance(
  instanceUuid: string,
  overrideUrl?: string,
  overrideKey?: string,
): Promise<EvolutionResponse> {
  return callApi(
    'DELETE',
    `/instance/delete/${encodeURIComponent(instanceUuid)}`,
    undefined,
    overrideUrl,
    overrideKey,
  );
}
