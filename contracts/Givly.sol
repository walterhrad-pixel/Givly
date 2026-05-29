// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Givly is Ownable, ReentrancyGuard {

    uint256 public constant MIN_STAGE_INTERVAL = 2 minutes;

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
        CampaignStatus status;
        uint256 currentStage;
        uint256 lastReleaseTime;
        Stage[] stages;
        address[] donors;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donorAmounts;

    event CampaignCreated(uint256 indexed id, string title, address ngo, uint256 goal);
    event DonationReceived(uint256 indexed campaignId, address donor, uint256 amount);
    event StageReleased(uint256 indexed campaignId, uint256 stageIndex, uint256 amount);
    event CampaignFrozen(uint256 indexed campaignId, string reason);

    constructor() Ownable(msg.sender) {}

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
        c.lastReleaseTime = block.timestamp;

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
            emit CampaignFrozen(_campaignId, "Early release request detected");
            return;
        }

        Stage storage s = c.stages[c.currentStage];
        require(!s.released, "Stage already released");
        require(address(this).balance >= s.amount, "Insufficient contract balance");

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
        uint256 lastReleaseTime
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (
            c.id, c.title, c.description, c.ngo,
            c.goal, c.totalDonated, uint8(c.status),
            c.currentStage, c.lastReleaseTime
        );
    }

    function getTimeUntilNextRelease(uint256 _campaignId) external view returns (uint256) {
        Campaign storage c = campaigns[_campaignId];
        uint256 nextAllowed = c.lastReleaseTime + MIN_STAGE_INTERVAL;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }
}