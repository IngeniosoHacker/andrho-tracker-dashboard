// reactbits.dev-style "GradientText": inline gradient-filled text.
export default function GradientText({ as: Tag = 'span', className = '', children }) {
  return <Tag className={`text-gradient ${className}`}>{children}</Tag>
}
