# Geo.Delivery

Geo.delivery simplifies IoT communication by leveraging Hedera Consensus Service to ensure secure, scalable, and efficient device messaging. The platform provides real-time, reliable data exchange for IoT devices, enabling seamless integration and robust performance across applications.

## 🚀 Features

- Hedera Hashgraph integration
- Magic.link authentication
- Iot messaging api endpoint integrated to hedera consensus service
- Responsive UI built with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15.1, React 19
- **Authentication**: Magic.link (with Hedera extension)
- **Blockchain**: Hedera Hashgraph
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: Redis
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- Redis server
- Hedera testnet account
- Magic.link account

## Environment Variables

To run this project, you'll need to set up the following environment variables in your `.env` file, copy .env.sample and setup as below

### Required Variables Explanation:

1. **Magic.link Authentication:**

   - `NEXT_PUBLIC_MAGIC_KEY`: Public API key from Magic.link dashboard
   - `MAGIC_SECRET_KEY`: Secret key from Magic.link dashboard

2. **Hedera Network:**

   - `NEXT_PUBLIC_NETWORK`: Specify which Hedera network to use ('testnet' or 'mainnet')
   - `NEXT_PUBLIC_HEDERA_ACCOUNT_ID`: Your Operator Hedera account ID
   - `HEDERA_PRIVATE_KEY`: Your Operator Hedera account private key

3. **Database:**
   - `REDIS_URL`: Connection URL for Redis database

## Running locally

    - clone repo and `cd path` in to it
    - `npm install` dependencies
    - copy .env.sample to .env and update env variables
    - `npm run dev` to run the project locally
