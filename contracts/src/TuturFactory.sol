// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TuturFactory {
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MIN_TASK_DURATION = 1 hours;

    error ZeroAddress();
    error DuplicateValidator();
    error InvalidFeeBps();
    error InvalidReward();
    error InvalidMetadataHash();
    error DeadlineTooSoon();
    error IncorrectPayment();
    error FeeRoundsToZero();
    error IndexOutOfBounds();

    address public immutable treasury;
    address public immutable validator1;
    address public immutable validator2;
    address public immutable validator3;
    uint16 public immutable feeBps;

    address[] private tasks;

    event TaskCreated(
        address indexed taskAddress,
        address indexed sponsor,
        bytes32 indexed metadataHash,
        uint256 rewardAmount,
        uint256 feeAmount,
        uint64 deadline
    );

    constructor(
        address treasury_,
        address validator1_,
        address validator2_,
        address validator3_,
        uint16 feeBps_
    ) {
        if (
            treasury_ == address(0) || validator1_ == address(0)
                || validator2_ == address(0) || validator3_ == address(0)
        ) revert ZeroAddress();
        if (
            validator1_ == validator2_ || validator1_ == validator3_
                || validator2_ == validator3_
        ) revert DuplicateValidator();
        if (feeBps_ == 0 || feeBps_ > 1_000) revert InvalidFeeBps();

        treasury = treasury_;
        validator1 = validator1_;
        validator2 = validator2_;
        validator3 = validator3_;
        feeBps = feeBps_;
    }

    function createTask(bytes32 metadataHash, uint256 rewardAmount, uint64 deadline)
        external
        payable
        returns (address taskAddress)
    {
        if (metadataHash == bytes32(0)) revert InvalidMetadataHash();
        if (rewardAmount == 0) revert InvalidReward();
        if (uint256(deadline) < block.timestamp + MIN_TASK_DURATION) {
            revert DeadlineTooSoon();
        }

        uint256 feeAmount = rewardAmount * feeBps / FEE_DENOMINATOR;
        if (feeAmount == 0) revert FeeRoundsToZero();
        if (msg.value != rewardAmount + feeAmount) revert IncorrectPayment();

        taskAddress = address(
            new TuturTask{value: msg.value}(
                msg.sender,
                treasury,
                rewardAmount,
                feeAmount,
                deadline,
                metadataHash,
                validator1,
                validator2,
                validator3
            )
        );
        tasks.push(taskAddress);

        emit TaskCreated(taskAddress, msg.sender, metadataHash, rewardAmount, feeAmount, deadline);
    }

    function getTaskCount() external view returns (uint256) {
        return tasks.length;
    }

    function taskAt(uint256 index) external view returns (address) {
        if (index >= tasks.length) revert IndexOutOfBounds();
        return tasks[index];
    }
}

contract TuturTask {
    enum Status {
        Open,
        Submitted,
        Paid,
        Rejected,
        Refunded
    }

    uint256 public constant VOTE_THRESHOLD = 2;

    error InvalidConstructorValue();
    error InvalidContentHash();
    error TermsNotAccepted();
    error SponsorCannotContribute();
    error InvalidStatus();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error NotValidator();
    error AlreadyVoted();
    error TransferFailed();

    address public immutable sponsor;
    address public immutable treasury;
    address public immutable validator1;
    address public immutable validator2;
    address public immutable validator3;
    uint256 public immutable rewardAmount;
    uint256 public immutable feeAmount;
    uint64 public immutable deadline;
    bytes32 public immutable metadataHash;

    address public contributor;
    bytes32 public contributionHash;
    Status public status;
    uint256 public approvals;
    uint256 public rejections;
    mapping(address => bool) public hasVoted;

    event ContributionSubmitted(
        address indexed contributor, bytes32 indexed contentHash, bool agreedToTerms
    );
    event ValidatorVoted(
        address indexed validator, bool approve, uint256 approvals, uint256 rejections
    );
    event TaskFinalized(Status status, address indexed recipient, uint256 rewardPaid, uint256 feePaid);
    event SponsorRefunded(address indexed sponsor, uint256 amount);

    constructor(
        address sponsor_,
        address treasury_,
        uint256 rewardAmount_,
        uint256 feeAmount_,
        uint64 deadline_,
        bytes32 metadataHash_,
        address validator1_,
        address validator2_,
        address validator3_
    ) payable {
        if (msg.value != rewardAmount_ + feeAmount_) revert InvalidConstructorValue();

        sponsor = sponsor_;
        treasury = treasury_;
        rewardAmount = rewardAmount_;
        feeAmount = feeAmount_;
        deadline = deadline_;
        metadataHash = metadataHash_;
        validator1 = validator1_;
        validator2 = validator2_;
        validator3 = validator3_;
        status = Status.Open;
    }

    function submitContribution(bytes32 contentHash, bool agreedToTerms) external {
        if (status != Status.Open) revert InvalidStatus();
        if (block.timestamp >= deadline) revert DeadlinePassed();
        if (contentHash == bytes32(0)) revert InvalidContentHash();
        if (msg.sender == sponsor) revert SponsorCannotContribute();
        if (!agreedToTerms) revert TermsNotAccepted();

        contributor = msg.sender;
        contributionHash = contentHash;
        status = Status.Submitted;

        emit ContributionSubmitted(msg.sender, contentHash, agreedToTerms);
    }

    function vote(bool approve) external {
        if (
            msg.sender != validator1 && msg.sender != validator2 && msg.sender != validator3
        ) revert NotValidator();
        if (status != Status.Submitted) revert InvalidStatus();
        if (block.timestamp >= deadline) revert DeadlinePassed();
        if (hasVoted[msg.sender]) revert AlreadyVoted();

        hasVoted[msg.sender] = true;
        if (approve) {
            approvals++;
        } else {
            rejections++;
        }

        emit ValidatorVoted(msg.sender, approve, approvals, rejections);

        if (approvals == VOTE_THRESHOLD) {
            status = Status.Paid;
            _send(treasury, feeAmount);
            _send(contributor, rewardAmount);
            emit TaskFinalized(Status.Paid, contributor, rewardAmount, feeAmount);
        } else if (rejections == VOTE_THRESHOLD) {
            status = Status.Rejected;
            uint256 refundAmount = address(this).balance;
            _send(sponsor, refundAmount);
            emit TaskFinalized(Status.Rejected, sponsor, 0, 0);
            emit SponsorRefunded(sponsor, refundAmount);
        }
    }

    function refundAfterDeadline() external {
        if (block.timestamp <= deadline) revert DeadlineNotPassed();
        if (status != Status.Open && status != Status.Submitted) revert InvalidStatus();

        status = Status.Refunded;
        uint256 refundAmount = address(this).balance;
        _send(sponsor, refundAmount);

        emit TaskFinalized(Status.Refunded, sponsor, 0, 0);
        emit SponsorRefunded(sponsor, refundAmount);
    }

    function _send(address recipient, uint256 amount) private {
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
