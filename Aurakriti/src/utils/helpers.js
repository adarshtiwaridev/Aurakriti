export function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}
