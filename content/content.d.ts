// Type declarations for content YAML files
declare module '*.yaml' {
  const content: unknown
  export default content
}

declare module '*.yml' {
  const content: unknown
  export default content
}
