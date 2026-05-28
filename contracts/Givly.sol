// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Givly is Ownable, ReentrancyGuard {

    uint256 public constant VOTE_THRESHOLD = 60; // 60% of total donated must vote yes

    struct Milestone {
        string description;
        uint256 amount;
        bool released;
        uint256 votesFor;
        uint256 votesAgainst;
    }

    struct Campaign {
        uint256 id;
        string title;
        string description;
        address payable ngo;
        uint256 goal;
        uint256 totalDonated;
        bool active;
        Milestone[] milestones;
        address[] donors;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donorAmounts;
    // campaignId => milestoneIndex => donor => hasVoted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    event CampaignCreated(uint256 indexed id, string title, address ngo, uint256 goal);
    event DonationReceived(uint256 indexed campaignId, address donor, uint256 amount);
    event VoteCast(uint256 indexed campaignId, uint256 milestoneIndex, address voter, bool approve);
    event FundsReleased(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ── Create Campaign (owner only) ──────────────────────────
    function createCampaign(
        string calldata _title,
        string calldata _description,
        address payable _ngo,
        uint256 _goal,
        string[] calldata _milestoneDescs,
        uint256[] calldata _milestoneAmounts
    ) external onlyOwner {
        require(_milestoneDescs.length == _milestoneAmounts.length, "Milestone mismatch");
        require(_milestoneDescs.length > 0, "Need at least one milestone");
        require(_ngo != address(0), "Invalid NGO address");

        uint256 total;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            total += _milestoneAmounts[i];
        }
        require(total == _goal, "Milestone amounts must sum to goal");

        Campaign storage c = campaigns[campaignCount];
        c.id = campaignCount;
        c.title = _title;
        c.description = _description;
        c.ngo = _ngo;
        c.goal = _goal;
        c.active = true;

        for (uint256 i = 0; i < _milestoneDescs.length; i++) {
            c.milestones.push(Milestone({
                description: _milestoneDescs[i],
                amount: _milestoneAmounts[i],
                released: false,
                votesFor: 0,
                votesAgainst: 0
            }));
        }

        emit CampaignCreated(campaignCount, _title, _ngo, _goal);
        campaignCount++;
    }

    // ── Donate ────────────────────────────────────────────────
    function donate(uint256 _campaignId) external payable nonReentrant {
        Campaign storage c = campaigns[_campaignId];
        require(c.active, "Campaign not active");
        require(msg.value > 0, "Donation must be > 0");

        if (donorAmounts[_campaignId][msg.sender] == 0) {
            c.donors.push(msg.sender);
        }
        donorAmounts[_campaignId][msg.sender] += msg.value;
        c.totalDonated += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    // ── Vote on Milestone (donors only) ──────────────────────
    function voteOnMilestone(
        uint256 _campaignId,
        uint256 _milestoneIndex,
        bool _approve
    ) external {
        Campaign storage c = campaigns[_campaignId];
        require(donorAmounts[_campaignId][msg.sender] > 0, "Only donors can vote");
        require(!hasVoted[_campaignId][_milestoneIndex][msg.sender], "Already voted");
        require(!c.milestones[_milestoneIndex].released, "Already released");

        hasVoted[_campaignId][_milestoneIndex][msg.sender] = true;

        Milestone storage m = c.milestones[_milestoneIndex];
        if (_approve) {
            m.votesFor += donorAmounts[_campaignId][msg.sender];
        } else {
            m.votesAgainst += donorAmounts[_campaignId][msg.sender];
        }

        emit VoteCast(_campaignId, _milestoneIndex, msg.sender, _approve);

        // Auto-release if threshold met
        if (m.votesFor * 100 >= c.totalDonated * VOTE_THRESHOLD) {
            _releaseFunds(_campaignId, _milestoneIndex);
        }
    }

    // ── Internal Release ──────────────────────────────────────
    function _releaseFunds(uint256 _campaignId, uint256 _milestoneIndex) internal {
        Campaign storage c = campaigns[_campaignId];
        Milestone storage m = c.milestones[_milestoneIndex];
        require(!m.released, "Already released");
        require(address(this).balance >= m.amount, "Insufficient balance");

        m.released = true;
        c.ngo.transfer(m.amount);

        emit FundsReleased(_campaignId, _milestoneIndex, m.amount);
    }

    // ── Emergency release by owner if voting stalls ───────────
    function forceRelease(uint256 _campaignId, uint256 _milestoneIndex) external onlyOwner nonReentrant {
        _releaseFunds(_campaignId, _milestoneIndex);
    }

    // ── Views ─────────────────────────────────────────────────
    function getMilestones(uint256 _campaignId) external view returns (Milestone[] memory) {
        return campaigns[_campaignId].milestones;
    }

    function getDonors(uint256 _campaignId) external view returns (address[] memory) {
        return campaigns[_campaignId].donors;
    }

    function getCampaign(uint256 _campaignId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address ngo,
        uint256 goal,
        uint256 totalDonated,
        bool active
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (c.id, c.title, c.description, c.ngo, c.goal, c.totalDonated, c.active);
    }

    function getVoteStatus(uint256 _campaignId, uint256 _milestoneIndex) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 threshold,
        bool canRelease
    ) {
        Campaign storage c = campaigns[_campaignId];
        Milestone storage m = c.milestones[_milestoneIndex];
        uint256 needed = (c.totalDonated * VOTE_THRESHOLD) / 100;
        return (
            m.votesFor,
            m.votesAgainst,
            needed,
            m.votesFor >= needed
        );
    }
}