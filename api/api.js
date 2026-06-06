export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://geral-myboard--api.r954jc.easypanel.host";

export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api";

export const API_VERSION = "v1";

export function buildApiUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
}

export const ENDPOINTS = {
  ping: `/${API_VERSION}/ping`,
  auth: {
    register: `/${API_VERSION}/auth/register`,
    login: `/${API_VERSION}/auth/login`,
    me: `/${API_VERSION}/auth/me`,
    onboarding: `/${API_VERSION}/auth/onboarding`,
    updateProfile: `/${API_VERSION}/auth/me`,
    forgotPassword: `/${API_VERSION}/auth/forgot-password`,
    resetPassword: `/${API_VERSION}/auth/reset-password`,
    changePassword: `/${API_VERSION}/auth/change-password`,
  },
  clients: `/${API_VERSION}/clients`,
  projects: `/${API_VERSION}/projects`,
  folders: `/${API_VERSION}/folders`,
  tags: `/${API_VERSION}/tags`,
  agenda: `/${API_VERSION}/agenda`,
  media: `/${API_VERSION}/media`,
  notifications: `/${API_VERSION}/notifications`,
  activities: `/${API_VERSION}/activities`,
  finance: `/${API_VERSION}/finance`,
  demands: `/${API_VERSION}/demands`,
  boards: `/${API_VERSION}/boards`,
  ingestion: {
    analyze: `/${API_VERSION}/ingestion/analyze`,
    apply: `/${API_VERSION}/ingestion/apply`,
    extract: `/${API_VERSION}/ingestion/extract`,
  },
  bordie: {
    chat: `/${API_VERSION}/bordie/chat`,
    command: `/${API_VERSION}/bordie/command`,
  },
  users: `/${API_VERSION}/users`,
  admin: {
    tenants: `/${API_VERSION}/admin/tenants`,
  },
};
