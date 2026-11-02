export function revealWordRow(input: HTMLInputElement | null | undefined) {
  if (!input) return
  const row = input.closest<HTMLElement>('.word-row') ?? input
  row.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
