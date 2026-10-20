# Ethereum Wallet

A browser-based Ethereum wallet built with React and ethers.js. Runs on the **Sepolia testnet** — no real ETH involved.

## Features

- Generate a new wallet with a 12-word seed phrase
- Import an existing wallet via seed phrase or private key
- View your ETH balance
- Send ETH to any address
- Add ERC-20 tokens by contract address
- View and send ERC-20 token balances
- Links to Sepolia Etherscan for all transactions

## Running Locally

**Requirements:** [Node.js](https://nodejs.org) (LTS version)

```bash
# From the repo root
cd eth-wallet
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Deploying to the Cloud

### Vercel (recommended)

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account
2. Click **Add New Project** and import this repository
3. Set the following build settings:
   - **Root Directory:** `eth-wallet`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**

### Netlify

1. Sign in at [netlify.com](https://netlify.com) with your GitHub account
2. Click **Add new site → Import an existing project**
3. Select this repository and set:
   - **Base directory:** `eth-wallet`
   - **Build command:** `npm run build`
   - **Publish directory:** `eth-wallet/dist`
4. Click **Deploy**

## Getting Testnet ETH

The wallet connects to the Sepolia testnet. To get free test ETH:

- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucet.sepolia.dev](https://faucet.sepolia.dev)

## Example ERC-20 Token (Sepolia)

Chainlink LINK token contract address on Sepolia:
```
0x779877A7B0D9E8603169DdbD7836e478b4624789
```

Paste this into the **Add Token** field to test ERC-20 functionality.

## Security Notes

- Your private key is held **only in browser memory** and is never saved to disk or sent to any server
- Closing or refreshing the page clears the wallet — you will need to re-import using your seed phrase
- This wallet is for **testnet use** — do not use it to manage real funds on mainnet

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [ethers.js v6](https://docs.ethers.org/v6/) | Ethereum library |
| [Vite](https://vitejs.dev) | Build tool / dev server |
| Sepolia RPC | `https://rpc.sepolia.org` |
