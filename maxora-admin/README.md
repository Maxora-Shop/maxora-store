# Maxora Admin Panel

Dedicated, isolated administrative portal for Maxora Bangladesh online store (`https://maxora-admin.vercel.app`).

## Architecture & Security Separation
This application is completely isolated from the customer storefront (`https://maxora-store.vercel.app`):
- No admin links or routes exist on the storefront.
- Protected authentication with PIN & session tokens.
- Complete inventory management, order pipeline, customer CRM, sales analytics, and invoice generator.

## Environment Configuration
Create a `.env` or `.env.local` file:
```env
VITE_API_URL=https://maxora-store.vercel.app
```

## Running Locally
```bash
npm install
npm run dev
```

## Production Build & Vercel Deployment
To deploy to Vercel as `maxora-admin`:
1. Connect this directory or repository (`Maxora-Shop/maxora-admin`) to Vercel.
2. Set the Environment Variable:
   `VITE_API_URL` = `https://maxora-store.vercel.app` (or your live API URL)
3. Deploy!
