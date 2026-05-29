// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Givly is Ownable, ReentrancyGuard {

    uint256 public constant MIN_STAGE_INTERVAL = 30 days;
    uint256 public constant REFUND_WINDOW = 30 days;

    enum CampaignStatus { Active, Frozen, Completed }

    struct Stage {
        string description;
        uint256 amount;
        bool released;
        uint256 releasedAt;
    }

    struct Campaign {
        uint256 id;
        string title;
        string description;
        address payable ngo;
        uint256 goal;
        uint256 totalDonated;
        uint256 frozenAt;
        CampaignStatus status;
        uint256 currentStage;
        uint256 lastReleaseTime;
        Stage[] stages;
        address[] donors;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donorAmounts;
    mapping(uint256 => mapping(address => bool)) public refundClaimed;

    event CampaignCreated(uint256 indexed id, string title, address ngo, uint256 goal);
    event DonationReceived(uint256 indexed campaignId, address donor, uint256 amount);
    event StageReleased(uint256 indexed campaignId, uint256 stageIndex, uint256 amount);
    event CampaignFrozen(uint256 indexed campaignId, uint256 frozenAt);
    event RefundClaimed(uint256 indexed campaignId, address donor, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ── Create Campaign (owner only) ──────────────────────────
    function createCampaign(
        string calldata _title,
        string calldata _description,
        address payable _ngo,
        uint256 _goal,
        string[] calldata _stageDescs,
        uint256[] calldata _stageAmounts
    ) external onlyOwner {
        require(_stageDescs.length == _stageAmounts.length, "Stage mismatch");
        require(_stageDescs.length > 0, "Need at least one stage");
        require(_ngo != address(0), "Invalid NGO address");

        uint256 total;
        for (uint256 i = 0; i < _stageAmounts.length; i++) {
            total += _stageAmounts[i];
        }
        require(total == _goal, "Stage amounts must sum to goal");

        Campaign storage c = campaigns[campaignCount];
        c.id = campaignCount;
        c.title = _title;
        c.description = _description;
        c.ngo = _ngo;
        c.goal = _goal;
        c.status = CampaignStatus.Active;
        c.currentStage = 0;
        c.lastReleaseTime = block.timestamp - MIN_STAGE_INTERVAL;

        for (uint256 i = 0; i < _stageDescs.length; i++) {
            c.stages.push(Stage({
                description: _stageDescs[i],
                amount: _stageAmounts[i],
                released: false,
                releasedAt: 0
            }));
        }

        emit CampaignCreated(campaignCount, _title, _ngo, _goal);
        campaignCount++;
    }

    // ── Donate ────────────────────────────────────────────────
    function donate(uint256 _campaignId) external payable nonReentrant {
        Campaign storage c = campaigns[_campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(msg.value > 0, "Donation must be > 0");

        if (donorAmounts[_campaignId][msg.sender] == 0) {
            c.donors.push(msg.sender);
        }
        donorAmounts[_campaignId][msg.sender] += msg.value;
        c.totalDonated += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    function requestRelease(uint256 _campaignId) external nonReentrant {
        Campaign storage c = campaigns[_campaignId];
        require(msg.sender == c.ngo, "Only NGO can request release");
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(c.currentStage < c.stages.length, "All stages released");

        if (block.timestamp < c.lastReleaseTime + MIN_STAGE_INTERVAL) {
            c.status = CampaignStatus.Frozen;
            c.frozenAt = block.timestamp;
            emit CampaignFrozen(_campaignId, block.timestamp);
            return;
        }

        Stage storage s = c.stages[c.currentStage];
        require(s.released == false, "Stage already released");
        require(address(this).balance >= s.amount, "Insufficient balance");

        s.released = true;
        s.releasedAt = block.timestamp;
        c.lastReleaseTime = block.timestamp;
        c.currentStage++;

        if (c.currentStage == c.stages.length) {
            c.status = CampaignStatus.Completed;
        }

        c.ngo.transfer(s.amount);
        emit StageReleased(_campaignId, c.currentStage - 1, s.amount);
    }

    function claimRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage c = campaigns[_campaignId];
        require(c.status == CampaignStatus.Frozen, "Campaign not frozen");
        require(block.timestamp >= c.frozenAt + REFUND_WINDOW, "Refund window not open yet");
        require(donorAmounts[_campaignId][msg.sender] > 0, "Not a donor");
        require(refundClaimed[_campaignId][msg.sender] == false, "Refund already claimed");

        uint256 totalLocked = address(this).balance;
        uint256 donorShare = (donorAmounts[_campaignId][msg.sender] * totalLocked) / c.totalDonated;

        refundClaimed[_campaignId][msg.sender] = true;
        payable(msg.sender).transfer(donorShare);

        emit RefundClaimed(_campaignId, msg.sender, donorShare);
    }

    function getRefundStatus(uint256 _campaignId, address _donor) external view returns (
        bool isFrozen,
        bool refundAvailable,
        bool alreadyClaimed,
        uint256 estimatedRefund,
        uint256 timeUntilRefund
    ) {
        Campaign storage c = campaigns[_campaignId];
        isFrozen = c.status == CampaignStatus.Frozen;
        alreadyClaimed = refundClaimed[_campaignId][_donor];
        uint256 unlockTime = c.frozenAt + REFUND_WINDOW;
        refundAvailable = isFrozen && block.timestamp >= unlockTime && alreadyClaimed == false;
        uint256 totalLocked = address(this).balance;
        estimatedRefund = c.totalDonated > 0
            ? (donorAmounts[_campaignId][_donor] * totalLocked) / c.totalDonated
            : 0;
        timeUntilRefund = block.timestamp >= unlockTime ? 0 : unlockTime - block.timestamp;
    }

    function getStages(uint256 _campaignId) external view returns (Stage[] memory) {
        return campaigns[_campaignId].stages;
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
        uint8 status,
        uint256 currentStage,
        uint256 lastReleaseTime,
        uint256 frozenAt
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (
            c.id, c.title, c.description, c.ngo,
            c.goal, c.totalDonated, uint8(c.status),
            c.currentStage, c.lastReleaseTime, c.frozenAt
        );
    }

    function getTimeUntilNextRelease(uint256 _campaignId) external view returns (uint256) {
        Campaign storage c = campaigns[_campaignId];
        uint256 nextAllowed = c.lastReleaseTime + MIN_STAGE_INTERVAL;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
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