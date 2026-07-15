const environmentMap = {
  local: {
    name: "Local",
    apiBaseUrl: "http://localhost:13010"
  },
  test: {
    name: "Testing",
    apiBaseUrl: "http://xhsapitest.powermatrix.tech"
  },
  prod: {
    name: "Production",
    apiBaseUrl: "https://xhsapi.powermatrix.tech"
  }
} as const;

export type BackendEnvironment = keyof typeof environmentMap;

export function getBackendEnvironment() {
  const rawEnv = process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "local";
  return (rawEnv in environmentMap ? rawEnv : "local") as BackendEnvironment;
}

export function getBackendEnvironmentConfig() {
  return environmentMap[getBackendEnvironment()];
}

export function getBackendApiBaseUrl() {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || getBackendEnvironmentConfig().apiBaseUrl;
  const normalized = rawBaseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/client") ? normalized : `${normalized}/client`;
}
