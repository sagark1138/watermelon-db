const fs = require('fs')
const path = require('path')

function setup() {
  const pkgPath = path.join(__dirname, '../package.json')

  if (!fs.existsSync(pkgPath)) {
    console.error('❌ package.json not found!')
    process.exit(1)
  }

  let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  // Skip if already configured (check if scheme key is missing)
  if (!pkg.scheme || pkg.scheme !== 'template-scheme') {
    console.log('✅ Project already configured!')
    process.exit(0)
  }

  const projectName = pkg.name
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-') // Sanitize slug

  console.log(`\n🚀 Configuring project: ${projectName}\n`) // Fixed: backticks were wrong

  // 1. Update app.json
  updateJson(projectName, slug)

  // 2. Remove scheme key from package.json (one-time setup indicator)
  removeSchemeFromPackageJson()

  console.log('\n✅ Setup complete!')
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review app.json to verify configuration`)
  console.log(`   2. Run: npx expo prebuild (watermelon db requires development build)\n`)
  console.log(`   3. Run: npm run ios / npm run android\n`)
}

function updateJson(projectName, slug) {
  const configPath = path.join(__dirname, '../app.json')

  if (!fs.existsSync(configPath)) {
    console.warn('⚠️  app.json not found, skipping...')
    return
  }

  try {
    // Read and parse as JSON first for better error handling
    const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    // Update values if they exist
    if (appConfig.expo) {
      if (appConfig.expo.name) appConfig.expo.name = projectName
      if (appConfig.expo.slug) appConfig.expo.slug = slug
      if (appConfig.expo.scheme) appConfig.expo.scheme = slug
    }

    // Write back with proper formatting
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2) + '\n')
    console.log('✓ Updated app.json')
  } catch (error) {
    console.error('❌ Failed to update app.json:', error.message)
    throw error
  }
}

function removeSchemeFromPackageJson() {
  const pkgPath = path.join(__dirname, '../package.json')

  try {
    // Re-read the file to ensure we have the latest content
    const pkgContent = fs.readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgContent)

    // Remove the scheme key
    if (pkg.scheme) {
      delete pkg.scheme
      console.log('✓ Removed scheme key from package.json')
    }

    // Also remove the postinstall script to prevent running again
    if (pkg.scripts && pkg.scripts.postinstall) {
      delete pkg.scripts.postinstall
      console.log('✓ Removed postinstall script')
    }

    // Write back to file with proper formatting
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message)
    throw error
  }
}

// Run setup
try {
  setup()
} catch (error) {
  console.error('❌ Setup failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
