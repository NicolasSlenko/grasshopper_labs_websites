This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
## Environment Setup

This app uses AWS S3 (uploads, resume, preferences, matched courses) and Clerk for auth. Create a `.env.local` at the repo root (copy from `.env.example`) and fill in the required values:

Required variables:
- `AWS_BUCKET_NAME`: Your S3 bucket name
- `AWS_BUCKET_REGION`: Bucket region (e.g., `us-east-1`)
- `IAM_AWS_ACCESS_KEY`: IAM Access Key ID with Put/Get/Delete access to the bucket
- `IAM_AWS_SECRET_ACCESS_KEY`: IAM Secret Access Key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key

On Windows PowerShell, you can scaffold a `.env.local` like this and then edit it:

```powershell
Copy-Item .env.example .env.local -Force
notepad .env.local
```

After updating env vars, restart the dev server so the API routes pick them up.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
