export const encodeQuery = (text: string): string => {
  if (!text) return '';
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return text;
  }
};

export const decodeQuery = (text: string): string => {
  if (!text) return '';
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return text;
  }
};
