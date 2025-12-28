import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// YAML 파일을 빌드 시점에 로드하는 플러그인
function yamlPlugin() {
  return {
    name: 'yaml-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.yaml') || id.endsWith('.yml')) {
        const content = readFileSync(id, 'utf-8')
        const parsed = yaml.load(content)
        return {
          code: `export default ${JSON.stringify(parsed)}`,
          map: null,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), yamlPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@content': resolve(__dirname, 'content'),
    },
  },
})
