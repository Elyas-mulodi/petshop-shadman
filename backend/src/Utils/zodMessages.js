export const requiredMsg = (label) => ({
  error: (issue) => (issue.input === undefined ? `${label} الزامی است` : `${label} معتبر نیست`),
});