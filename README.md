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