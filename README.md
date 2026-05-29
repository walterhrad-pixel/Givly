# Givly

Givly is a Hardhat-based Ethereum smart contract project implementing a milestone-driven donation platform. Donors fund campaigns and vote to release milestone funds to an NGO; the contract enforces vote thresholds and supports owner emergency release.

## Key Features

- Milestone-driven campaigns with per-milestone voting by donors
- Vote threshold (60%) required to auto-release milestone funds
- Donations tracked per donor; votes weighted by donated amount
- Emergency `forceRelease` by contract owner
- Reentrancy guarded and Ownable pattern via OpenZeppelin

## Repository Layout

- `contracts/Givly.sol` — Main Solidity smart contract implementing campaigns, milestones, donations and voting.
- `lib/contract.ts` — Example ABI and local contract address used by helper scripts.
- `scripts/deploy.js` — Hardhat deployment script for `Givly`.
- `scripts/send-op-tx.ts` — Example TypeScript script demonstrating `viem` usage and OP chain interaction.
- `hardhat.config.js` — Hardhat configuration (Solidity 0.8.20).
- `ignition/modules/Lock.js` — Ignition module example included in the project.
- `test/Lock.js` — Example test suite using Hardhat testing helpers and Chai.

## Contracts

Primary contract: `Givly` (see `contracts/Givly.sol`) — important public functions/events:

- `createCampaign(string title, string description, address ngo, uint256 goal, string[] milestoneDescs, uint256[] milestoneAmounts)` — owner-only campaign creation
- `donate(uint256 campaignId)` — payable donation function; donors recorded and donation amounts tracked
- `voteOnMilestone(uint256 campaignId, uint256 milestoneIndex, bool approve)` — donors vote; votes weighted by donor contribution
- `forceRelease(uint256 campaignId, uint256 milestoneIndex)` — owner emergency release
- Views: `getCampaign`, `getMilestones`, `getDonors`, `getVoteStatus`

Events: `CampaignCreated`, `DonationReceived`, `VoteCast`, `FundsReleased`, `OwnershipTransferred`

Security notes: uses OpenZeppelin `Ownable` and `ReentrancyGuard`. Review thresholds and off-chain assumptions before production use.

## Getting Started

Prerequisites: Node.js (16+ recommended), npm or pnpm, and Hardhat.

Install dependencies:

```bash
npm install
```

Compile contracts:

```bash
npx hardhat compile
```

Run tests (project contains example tests):

```bash
npm test
# or
npx hardhat test
```

Deploy locally (Hardhat network):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deploy script logs the deployer address and deployed contract address.

## Using the ABI

The contract ABI and an example local address are provided in `lib/contract.ts`. Use this to instantiate a contract client in scripts or frontends.

## Example: Sending Transactions via viem (L2/OP)

`scripts/send-op-tx.ts` contains an example showing how to create a `viem` client from a Hardhat network instance and send an L2 transaction (estimates L1 gas and sends a tiny value). Modify the network/client config to match your setup before running.

## Ignition and Modules

The `ignition/modules/Lock.js` file demonstrates a Hardhat Ignition module for deterministic deployments. It's included as an example and not required to use the `Givly` contract.

## Development Notes

- Solidity: `0.8.20` (see `hardhat.config.js`)
- OpenZeppelin Contracts used for ownership and reentrancy guards
- Tests currently include the `Lock` example; add `Givly` unit and integration tests before production deployment

## Next Steps / Suggestions

- Add comprehensive tests for `Givly` (donation flows, voting, edge cases)
- Add a script or frontend to create campaigns and submit donations/votes
- Add CI (e.g., GitHub Actions) to run `npx hardhat test` and `npx hardhat compile`

## License

This repository indicates `ISC` in `package.json`. Verify license compatibility before reuse.

---
# Givly

A blockchain-based donation platform connecting donors and verified NGOs. Donated funds are locked in a smart contract and released to NGOs in stages — only after a minimum time period has elapsed. If an NGO attempts to request funds early, the contract permanently freezes all remaining funds, protecting donors from misuse.

## How It Works

1. **Admin** creates a campaign with a target goal, NGO wallet address, and funding stages
2. **Donors** visit the platform, connect their MetaMask wallet, and donate ETH to any active campaign
3. **Funds are locked** in the smart contract — no single party controls them
4. **NGO requests release** of the current stage — if 30 days have passed since the last release, funds transfer automatically to the NGO wallet
5. **If NGO requests early** — the smart contract permanently freezes all remaining funds
6. **Frozen funds** are held for 30 days, after which donors can claim proportional refunds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.20 + OpenZeppelin |
| Blockchain Toolchain | Hardhat v2 |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Web3 | ethers v6 |
| Wallet | MetaMask |
| Testnet | Sepolia (local: Hardhat Network) |

## Project Structure

```
Givly/
├── contracts/
│   └── Givly.sol           # Smart contract
├── scripts/
│   ├── deploy.js           # Deploy contract + auto-update ABI
│   ├── seed.js             # Seed local node with sample campaigns
│   └── reset.js            # Wipe all campaigns and redeploy fresh
├── client/
│   ├── app/
│   │   ├── page.tsx                    # Homepage — campaign listing
│   │   ├── campaign/[id]/page.tsx      # Campaign detail — donor/NGO views
│   │   └── admin/page.tsx             # Admin dashboard — create campaigns
│   ├── components/
│   │   ├── ConnectWallet.tsx           # MetaMask connection
│   │   ├── CampaignCard.tsx            # Campaign preview card
│   │   ├── DonateForm.tsx              # Donation input
│   │   ├── StageList.tsx               # Funding stages + release
│   │   └── RefundClaim.tsx             # Donor refund on frozen campaigns
│   └── lib/
│       └── contract.ts                 # ABI + contract address
├── hardhat.config.js
└── package.json
```

## Prerequisites

- Node.js v18+
- MetaMask browser extension
- Git

## Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/walterhrad-pixel/Givly.git
cd Givly
```

### 2. Install root dependencies (Hardhat)

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client && npm install && cd ..
```

### 4. Start the local blockchain node (Terminal 1)

```bash
npx hardhat node
```

Leave this running. Keep this terminal open.

### 5. Deploy the smart contract (Terminal 2)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This deploys the contract and automatically updates `client/lib/contract.ts` with the new ABI and address.

### 6. Seed sample campaigns (Terminal 2)

```bash
npx hardhat run scripts/seed.js --network localhost
```

### 7. Start the frontend (Terminal 2)

```bash
cd client && npm run dev
```

Visit `http://localhost:3000`

### Resetting campaigns

To wipe all campaigns and start fresh:

```bash
npx hardhat run scripts/reset.js --network localhost
```

## MetaMask Setup

1. Install MetaMask from [metamask.io](https://metamask.io)
2. Add a custom network:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
3. Import test accounts using private keys from the Hardhat node output

### Test Accounts

**Contract Owner (Admin)**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**NGO Accounts**

| NGO | Address | Private Key | Campaign Password |
|-----|---------|-------------|-------------------|
| NGO 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` | `c79C8` |
| NGO 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` | `293BC` |
| NGO 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` | `b3906` |

**Donor Accounts**

| Donor | Address | Private Key |
|-------|---------|-------------|
| Donor 1 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| Donor 2 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| Donor 3 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` |

## Admin Access

Navigate to `/admin` in the address bar. Enter password: `Admin@123`

The admin page is intentionally not linked from the homepage.

## Smart Contract

| Function | Who | Description |
|----------|-----|-------------|
| `createCampaign()` | Owner only | Creates a new campaign with stages |
| `donate()` | Anyone | Sends ETH to a campaign |
| `requestRelease()` | NGO only | Requests next stage release |
| `claimRefund()` | Donors | Claims refund if campaign is frozen |

## Deployment

For hackathon/demo purposes the app runs on a local Hardhat node. For production deployment see the **Deploy to Sepolia** section below.

### Deploy to Sepolia Testnet

1. Get Sepolia ETH from a faucet
2. Add to `.env`:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key
```
3. Update `hardhat.config.js` with Sepolia network config
4. Run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
5. Deploy frontend to Vercel:
```bash
cd client && npx vercel
```

## License

MIT
