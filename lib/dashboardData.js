export const assets = {
  byewind: "/dashboard/byewind.png",
  snowLogo: "/dashboard/snow-logo.png",
  snowUiLogo: "/dashboard/snowui-logo.png",
  snowUiText1: "https://www.figma.com/api/mcp/asset/73083fda-74d6-42ae-af26-2e965cab83d8",
  snowUiText2: "/dashboard/snowui-text.png",
  avatarAbstract03: "https://www.figma.com/api/mcp/asset/1ae0cf4b-b684-450d-ba80-69ae553b4b66",
  avatarFemale03: "https://www.figma.com/api/mcp/asset/8cc1cdf1-0f77-4389-9c26-b61417a0bedb",
  avatarMale02: "https://www.figma.com/api/mcp/asset/ad506146-ee00-4ca1-86a9-8a0963970d10",
  avatar3d03: "https://www.figma.com/api/mcp/asset/7f955ce7-2509-48ef-96e0-e235015c4537",
  avatarAbstract04: "https://www.figma.com/api/mcp/asset/db9193aa-0a65-417c-8c08-0be38f070042",
  avatarFemale06: "https://www.figma.com/api/mcp/asset/288ac230-1485-4e99-a1d0-333a54b7e449",
  avatarMale01: "https://www.figma.com/api/mcp/asset/b6b8b9b6-c800-4929-aa3e-9a80a7170d82",
  avatarFemale01: "https://www.figma.com/api/mcp/asset/687b2715-d2cc-44af-84f5-a3fb702a021e",
  avatarMale04: "https://www.figma.com/api/mcp/asset/f8eaab99-32e9-41f7-a3e0-a48df4635910",
  avatarFemale04: "https://www.figma.com/api/mcp/asset/477202e6-ba7b-4d5a-8902-5da96e87d968",
  avatarFemale05: "https://www.figma.com/api/mcp/asset/21f2238b-2b01-4189-9686-7e621a732e87",
  avatarMale06: "https://www.figma.com/api/mcp/asset/ce8af547-9322-48c3-9a1f-6027de0d369a",
  avatarFemale02: "https://www.figma.com/api/mcp/asset/79563442-2060-4d63-922d-b86c46e34fc3",
  avatarAbstract01: "https://www.figma.com/api/mcp/asset/5f7a16cb-1137-4014-82ce-72ed09a50c85",
  avatarMale05: "https://www.figma.com/api/mcp/asset/d4f4e94e-4724-483f-b5de-738499f5a798",
  avatarMale03: "https://www.figma.com/api/mcp/asset/c23b67b2-6505-4d15-963a-33649d203d2c",
};

export const tabs = [
  "Overview",
  "Targets",
  "Budget",
  "Users",
  "Files",
  "Activity",
  "Settings",
];

export const notifications = [
  { icon: "bug", iconBg: "color2", title: "You fixed a bug.", time: "Just now" },
  { icon: "user", iconBg: "color1", title: "New user registeRed.", time: "59 minutes ago" },
  { icon: "bug", iconBg: "color2", title: "You fixed a bug.", time: "12 hours ago" },
  { icon: "broadcast", iconBg: "color1", title: "Andi Lane subscribed to you.", time: "Today, 11:59 AM" },
];

export const activities = [
  { avatar: assets.avatarAbstract03, title: "Changed the style.", time: "Just now" },
  { avatar: assets.avatarFemale03, title: "Released a new version.", time: "59 minutes ago" },
  { avatar: assets.avatarMale02, title: "Submitted a bug.", time: "12 hours ago" },
  { avatar: assets.avatar3d03, title: "Modified A data in Page X.", time: "Today, 11:59 AM" },
  { avatar: assets.avatarAbstract04, title: "Deleted a page in Project X.", time: "Feb 2, 2026" },
];

export const contacts = [
  { name: "Natali Craig", avatar: assets.avatarFemale06 },
  { name: "Drew Cano", avatar: assets.avatarMale01 },
  { name: "Andi Lane", avatar: assets.avatarFemale01 },
  { name: "Koray Okumus", avatar: assets.avatarMale04 },
  { name: "Kate Morrison", avatar: assets.avatarFemale04 },
  { name: "Melody Macy", avatar: assets.avatarFemale05 },
];

export const timelineDays = [
  { label: "SU", day: "22" },
  { label: "Mo", day: "23", active: true },
  { label: "Tu", day: "24" },
  { label: "We", day: "25" },
  { label: "Th", day: "26" },
  { label: "Fr", day: "27" },
  { label: "Sa", day: "28" },
];

export const timelineItems = [
  { avatar: assets.avatarFemale05, title: "You have a bug that needs to be fixed.", time: "Just now" },
  { avatar: assets.avatarMale06, title: "Released a new version", time: "59 minutes ago" },
  { avatar: assets.avatarFemale02, title: "Submitted a bug", time: "12 hours ago" },
  { avatar: assets.avatarAbstract01, title: "Modified A data in Page X", time: "Today, 11:59 AM" },
  { avatar: assets.avatarMale05, title: "Deleted a page in Project X", time: "Feb 2, 2026" },
];

export const latestFiles = [
  { type: "pdf", name: "Project tech requirements.pdf", meta: "5.6 MB / Just now / Karina Clark" },
  { type: "jpg", name: "Dashboard-design.jpg", meta: "2.3 MB / 59 minutes ago / Marcus Blake" },
  { type: "pdf", name: "Project tech requirements.pdf", meta: "5.6 MB / Just now / Karina Clark" },
  { type: "xls", name: "Project tech requirements.xls", meta: "5.6 MB / Just now / Karina Clark" },
  { type: "pdf", name: "Project tech requirements.pdf", meta: "5.6 MB / Just now / Karina Clark" },
];

export const spendings = [
  { manager: "ByeWind", avatar: assets.byewind, date: "Jun 24, 2026", amount: "$942.00", status: "in-progress" },
  { manager: "Natali Craig", avatar: assets.avatarFemale06, date: "Mar 10, 2026", amount: "$881.00", status: "complete" },
  { manager: "Drew Cano", avatar: assets.avatarMale01, date: "Nov 10, 2026", amount: "$409.00", status: "pending" },
  { manager: "Orlando Diggs", avatar: assets.avatarMale03, date: "Dec 20, 2026", amount: "$953.00", status: "approved" },
  { manager: "Andi Lane", avatar: assets.avatarFemale01, date: "Jul 25, 2026", amount: "$907.00", status: "rejected" },
];

export const teamAvatars = [
  { src: assets.avatarFemale05 },
  { src: assets.avatarMale06 },
  { src: assets.avatarFemale02 },
  { src: assets.avatarAbstract01 },
  { src: assets.avatarMale05 },
];

export const sidebarNav = {
  favorites: [
    { label: "Overview", dot: true },
    { label: "Projects", dot: true },
  ],
  dashboards: [
    { label: "Overview", active: true, icon: "chart" },
    { label: "eCommerce", icon: "bag" },
    { label: "Projects", icon: "folder" },
  ],
  pages: [
    { label: "User Profile", icon: "badge" },
    { label: "Overview", indent: true },
    { label: "Projects", indent: true },
    { label: "Campaigns", indent: true },
    { label: "Documents", indent: true },
    { label: "Followers", indent: true },
    { label: "Account", icon: "card" },
    { label: "Corporate", icon: "building" },
    { label: "Blog", icon: "notebook" },
    { label: "Social", icon: "chat" },
  ],
};
