##Steps follow to initialise this project

# Better Auth Secret (Generate with: npx @better-auth/cli secret)
BETTER_AUTH_SECRET="your_generated_secret"

# Local URL
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Generate Prisma client
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name init

# Database connection (Get this from Neon Console https://console.neon.tech/app/)
NEON_DATABASE_URL=""