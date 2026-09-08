export const formattedDate = (date: Date) => date.toLocaleString(undefined, {
    dateStyle: "medium", // e.g., "Sep 7, 2026" or "7 sep. 2026"
    timeStyle: "short",  // e.g., "8:52 AM" or "08:52"
});