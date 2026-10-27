// Applies database migrations during the Vercel build.
//
// The production database was originally created with `prisma db push`, which leaves no
// migration history. The first time this runs against such a database, Prisma reports P3005
// ("schema is not empty"). We then bring the database in line with the baseline schema (the
// same `db push` the old build did, which refuses to drop data), mark the baseline 0_init as
// applied, and continue with normal `migrate deploy` from then on.
import { execSync } from 'node:child_process'

const run = (cmd) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8' })
const npx = (args) => `npx prisma ${args}`

function deploy() {
  try {
    process.stdout.write(run(npx('migrate deploy')))
    return null
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`
  }
}

if (!process.env.DATABASE_URL) {
  console.log('[migrate] DATABASE_URL not set; skipping migrations')
  process.exit(0)
}

let failure = deploy()
if (failure && failure.includes('P3005')) {
  console.log('[migrate] existing database without migration history: baselining at 0_init')
  // Sync any small differences first (stops rather than drop data). This must ship while 0_init
  // is the only migration, so the pushed schema equals the baseline.
  process.stdout.write(run(npx('db push --skip-generate')))
  process.stdout.write(run(npx('migrate resolve --applied 0_init')))
  failure = deploy()
}
if (failure) {
  console.error(failure)
  process.exit(1)
}
