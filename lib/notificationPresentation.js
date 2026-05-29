export function getNotificationPresentation(eventType) {
  const type = eventType || "";

  if (type.startsWith("client.")) {
    return { icon: "user", iconBg: "color2" };
  }

  if (type.startsWith("agenda.")) {
    return { icon: "broadcast", iconBg: "color1" };
  }

  if (type.startsWith("folder.") || type.startsWith("project.moved")) {
    return { icon: "broadcast", iconBg: "color2" };
  }

  if (type.startsWith("media.")) {
    return { icon: "bell", iconBg: "color1" };
  }

  return { icon: "bell", iconBg: "color1" };
}
