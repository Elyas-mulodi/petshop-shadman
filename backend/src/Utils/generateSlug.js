const generateSlug = (text) => {
  return text
    .trim()
    .replace(/\s+/g, "-") 
    .replace(/[^\u0600-\u06FF0-9a-zA-Z-]/g, "")
    .replace(/-+/g, "-") 
    .replace(/^-|-$/g, ""); 
};

export default generateSlug;