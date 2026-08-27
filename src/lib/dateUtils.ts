export const formatDateIST = (dateString: string, istString?: string): string => {
  if (istString) return istString;
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};
