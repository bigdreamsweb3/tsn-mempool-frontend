# TSN Mempool Frontend

Next.js-based explorer UI for TrustLink TSN (Transfer Settlement Network) mempool.

## What it does

- Visualizes pending transactions in the mempool
- Shows transaction details, status, and history
- Real-time updates from the backend API

## Setup

```bash
npm install
npm run dev
```

Opens at http://localhost:3001

## Environment

Configure `NEXT_PUBLIC_BACKEND_URL` if not using the default proxy.

## Part of TrustLink

This is a submodule of [trustlink-pay](https://github.com/bigdreamsweb3/trustlink-pay).

For the backend server, see [tsn-mempool-backend](https://github.com/bigdreamsweb3/tsn-mempool-backend).