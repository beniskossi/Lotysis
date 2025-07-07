#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Clean Next.js build artifacts and cache to prevent corrupt manifest issues
 */
function cleanNextBuildArtifacts() {
  console.log('🧹 Cleaning Next.js build artifacts...')

  const nextDir = path.join(process.cwd(), '.next')
  const routesManifestPath = path.join(nextDir, 'routes-manifest.json')
  const cacheDir = path.join(nextDir, 'cache')

  try {
    // Delete routes-manifest.json if it exists
    if (fs.existsSync(routesManifestPath)) {
      fs.unlinkSync(routesManifestPath)
      console.log('✅ Deleted routes-manifest.json')
    }

    // Clear .next/cache directory
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true })
      console.log('✅ Cleared .next/cache directory')
    }

    // Recreate cache directory
    fs.mkdirSync(cacheDir, { recursive: true })
    console.log('✅ Recreated .next/cache directory')

    console.log('🎉 Next.js build artifacts cleaned successfully!')
  } catch (error) {
    console.error('❌ Error cleaning build artifacts:', error.message)
    process.exit(1)
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanNextBuildArtifacts()
}

export { cleanNextBuildArtifacts }
