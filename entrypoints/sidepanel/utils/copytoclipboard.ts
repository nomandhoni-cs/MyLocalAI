export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert("Summary copied to clipboard!");
};
