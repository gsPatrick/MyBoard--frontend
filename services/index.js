export * from "./api";
export * from "./client";

// Evita `export * as ns` (não suportado pelo transform do Vercel/Babel).
// import * as + export {} faz o mesmo barrel de forma compatível.
import * as authApi from "./auth";
import * as clientsApi from "./clients";
import * as projectsApi from "./projects";
import * as usersApi from "./users";
import * as foldersApi from "./folders";
import * as tagsApi from "./tags";
import * as agendaApi from "./agenda";
import * as notificationsApi from "./notifications";
import * as adminApi from "./admin";
import * as mediaApi from "./media";

export {
  authApi,
  clientsApi,
  projectsApi,
  usersApi,
  foldersApi,
  tagsApi,
  agendaApi,
  notificationsApi,
  adminApi,
  mediaApi,
};
