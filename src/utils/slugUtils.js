export const generateStoreSlug = (storeName) => {
  if (!storeName) return '';
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  const slug = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
    
  return slug;
};

export const validateStoreSlug = (slug) => {
  if (!slug) return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};
