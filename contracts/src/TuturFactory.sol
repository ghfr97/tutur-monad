// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title TuturTask
/// @notice Isolated escrow for one language-data micro-bounty.
/// Hackathon prototype. Not audited.
contract TuturTask {
    enum Status { Open, Submitted, Paid, Rejected, Refunded }

    address public immutable sponsor;
    address public immutable treasury;
    uint256 public immutable rewardAmount;
    uint256 public immutable feeAmount;
    uint64 public immutable deadline;
    bytes32 public immutable metadataHash;
    address public immutable validator1;
    address public immutable validator2;
    address public immutable validator3;

    address public contributor;
    bytes32 public contributionHash;
    Status public status;
    uint8 public approvals;
    uint8 public rejections;
    mapping(address => bool) public hasVoted;

    event ContributionSubmitted(address indexed contributor, bytes32 indexed contentHash, bool agreedToTerms);
    event ValidatorVoted(address indexed validator, bool approve, uint256 approvals, uint256 rejections);
    event TaskFinalized(Status status, address indexed recipient, uint256 rewardPaid, uint256 feePaid);
    event SponsorRefunded(address indexed sponsor, uint256 amount);

    error NotOpen();
    error NotSubmitted();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error ZeroHash();
    error SponsorCannotContribute();
    error TermsNotAccepted();
    error NotValidator();
    error AlreadyVoted();
    error TransferFailed();
    error AlreadyFinal();

    constructor(
        address sponsor_,
        address treasury_,
        uint256 rewardAmount_,
        uint256 feeAmount_,
        uint64 deadline_,
        bytes32 metadataHash_,
        address v1,
        address v2,
        address v3
    ) payable {
        sponsor = sponsor_;
        treasury = treasury_;
        rewardAmount = rewardAmount_;
        feeAmount = feeAmount_;
        deadline = deadline_;
        metadataHash = metadataHash_;
        validator1 = v1;
        validator2 = v2;
        validator3 = v3;
    }

    function isValidator(address a) public view returns (bool) {
        return a == validator1 || a == validator2 || a == validator3;
    }

    function submitContribution(bytes32 contentHash, bool agreedToTerms) external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (contentHash == bytes32(0)) revert ZeroHash();
        if (msg.sender == sponsor) revert SponsorCannotContribute();
        if (!agreedToTerms) revert TermsNotAccepted();

        contributor = msg.sender;
        contributionHash = contentHash;
        status = Status.Submitted;
        emit ContributionSubmitted(msg.sender, contentHash, agreedToTerms);
    }

    function vote(bool approve) external {
        if (status != Status.Submitted) revert NotSubmitted();
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (!isValidator(msg.sender)) revert NotValidator();
        if (hasVoted[msg.sender]) revert AlreadyVoted();

        hasVoted[msg.sender] = true;
        if (approve) approvals++; else rejections++;
        emit ValidatorVoted(msg.sender, approve, approvals, rejections);

        if (approvals >= 2) {
            status = Status.Paid; // effects before interactions
            _send(contributor, rewardAmount);
            _send(treasury, feeAmount);
            emit TaskFinalized(Status.Paid, contributor, rewardAmount, feeAmount);
        } else if (rejections >= 2) {
            status = Status.Rejected;
            uint256 bal = address(this).balance;
            _send(sponsor, bal);
            emit TaskFinalized(Status.Rejected, sponsor, 0, 0);
            emit SponsorRefunded(sponsor, bal);
        }
    }

    function refundAfterDeadline() external {
        if (status != Status.Open && status != Status.Submitted) revert AlreadyFinal();
        if (block.timestamp <= deadline) revert DeadlineNotPassed();
        status = Status.Refunded;
        uint256 bal = address(this).balance;
        _send(sponsor, bal);
        emit SponsorRefunded(sponsor, bal);
    }

    function _send(address to, uint256 amount) private {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}

/// @title TuturFactory
/// @notice Creates one independent TuturTask escrow per bounty. No admin withdrawal.
contract TuturFactory {
    address public immutable treasury;
    uint16 public immutable feeBps;
    address public immutable validator1;
    address public immutable validator2;
    address public immutable validator3;

    address[] private _tasks;

    event TaskCreated(
        address indexed taskAddress,
        address indexed sponsor,
        bytes32 indexed metadataHash,
        uint256 rewardAmount,
        uint256 feeAmount,
        uint64 deadline
    );

    error ZeroAddress();
    error DuplicateValidators();
    error InvalidFee();
    error ZeroReward();
    error ZeroMetadataHash();
    error InvalidDeadline();
    error ZeroFee();
    error WrongPayment();

    uint64 public constant MIN_DURATION = 5 minutes;

    constructor(address treasury_, address validator1_, address validator2_, address validator3_, uint16 feeBps_) {
        if (
            treasury_ == address(0) || validator1_ == address(0) || validator2_ == address(0)
                || validator3_ == address(0)
        ) revert ZeroAddress();
        if (validator1_ == validator2_ || validator1_ == validator3_ || validator2_ == validator3_) {
            revert DuplicateValidators();
        }
        if (feeBps_ == 0 || feeBps_ > 1000) revert InvalidFee();
        treasury = treasury_;
        validator1 = validator1_;
        validator2 = validator2_;
        validator3 = validator3_;
        feeBps = feeBps_;
    }

    function quoteFee(uint256 rewardAmount) public view returns (uint256) {
        return (rewardAmount * feeBps) / 10_000;
    }

    function createTask(bytes32 metadataHash, uint256 rewardAmount, uint64 deadline)
        external
        payable
        returns (address taskAddress)
    {
        if (rewardAmount == 0) revert ZeroReward();
        if (metadataHash == bytes32(0)) revert ZeroMetadataHash();
        if (deadline < block.timestamp + MIN_DURATION) revert InvalidDeadline();
        uint256 fee = quoteFee(rewardAmount);
        if (fee == 0) revert ZeroFee();
        if (msg.value != rewardAmount + fee) revert WrongPayment();

        TuturTask task = new TuturTask{value: msg.value}(
            msg.sender, treasury, rewardAmount, fee, deadline, metadataHash, validator1, validator2, validator3
        );
        taskAddress = address(task);
        _tasks.push(taskAddress);
        emit TaskCreated(taskAddress, msg.sender, metadataHash, rewardAmount, fee, deadline);
    }

    function getTaskCount() external view returns (uint256) {
        return _tasks.length;
    }

    function taskAt(uint256 index) external view returns (address) {
        return _tasks[index];
    }
}
