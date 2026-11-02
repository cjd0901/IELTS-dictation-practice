export function Wave({ small = false }: { small?: boolean }) {
  return (
    <span className={`wave ${small ? 'small' : ''}`} aria-hidden="true">
      {[11, 22, 31, 19, 12].map((height, i) => (
        <i key={i} style={{ height }} />
      ))}
    </span>
  )
}
