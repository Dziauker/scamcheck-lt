export function generateCaseId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `SC-${year}-${random}`
}
