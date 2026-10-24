// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TuturFactory, TuturTask} from "../src/TuturFactory.sol";

interface Vm {
    function deal(address account, uint256 balance) external;
    function prank(address msgSender) external;
    function expectRevert() external;
    function expectRevert(bytes4 revertData) external;
    function warp(uint256 timestamp) external;
}

contract TuturFactoryTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant SPONSOR = address(0x1001);
    address private constant CONTRIBUTOR = address(0x1002);
    address private constant VALIDATOR_1 = address(0x2001);
    address private constant VALIDATOR_2 = address(0x2002);
    address private constant VALIDATOR_3 = address(0x2003);
    address private constant TREASURY = address(0x3001);

    uint256 private constant REWARD = 1 ether;
    uint256 private constant FEE = 0.08 ether;
    uint256 private constant TOTAL = REWARD + FEE;
    bytes32 private constant METADATA_HASH = keccak256("task metadata");
    bytes32 private constant CONTENT_HASH = keccak256("contribution");

    TuturFactory private factory;

    function setUp() public {
        factory = new TuturFactory(
            TREASURY, VALIDATOR_1, VALIDATOR_2, VALIDATOR_3, 800
        );
        vm.deal(SPONSOR, 10 ether);
    }

    function testCreateTaskAndRecordAddress() public {
        TuturTask task = _createTask();

        assertEq(factory.getTaskCount(), 1);
        assertEq(factory.taskAt(0), address(task));
        assertEq(task.sponsor(), SPONSOR);
        assertEq(task.treasury(), TREASURY);
        assertEq(task.rewardAmount(), REWARD);
        assertEq(task.feeAmount(), FEE);
        assertEq(uint256(task.status()), uint256(TuturTask.Status.Open));
        assertEq(address(task).balance, TOTAL);
    }

    function testCreateTaskRejectsInsufficientPayment() public {
        vm.expectRevert(TuturFactory.IncorrectPayment.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: TOTAL - 1}(METADATA_HASH, REWARD, _deadline());
    }

    function testCreateTaskRejectsExcessPayment() public {
        vm.expectRevert(TuturFactory.IncorrectPayment.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: TOTAL + 1}(METADATA_HASH, REWARD, _deadline());
    }

    function testCreateTaskRejectsZeroReward() public {
        vm.expectRevert(TuturFactory.InvalidReward.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: 0}(METADATA_HASH, 0, _deadline());
    }

    function testCreateTaskRejectsZeroMetadataHash() public {
        vm.expectRevert(TuturFactory.InvalidMetadataHash.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: TOTAL}(bytes32(0), REWARD, _deadline());
    }

    function testCreateTaskRejectsDeadlineWithLessThanOneHour() public {
        vm.expectRevert(TuturFactory.DeadlineTooSoon.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: TOTAL}(
            METADATA_HASH, REWARD, uint64(block.timestamp + 1 hours - 1)
        );
    }

    function testCreateTaskRejectsFeeThatRoundsToZero() public {
        vm.expectRevert(TuturFactory.FeeRoundsToZero.selector);
        vm.prank(SPONSOR);
        factory.createTask{value: 1}(METADATA_HASH, 1, _deadline());
    }

    function testConstructorRejectsZeroAddress() public {
        vm.expectRevert(TuturFactory.ZeroAddress.selector);
        new TuturFactory(address(0), VALIDATOR_1, VALIDATOR_2, VALIDATOR_3, 800);
    }

    function testConstructorRejectsDuplicateValidators() public {
        vm.expectRevert(TuturFactory.DuplicateValidator.selector);
        new TuturFactory(TREASURY, VALIDATOR_1, VALIDATOR_1, VALIDATOR_3, 800);
    }

    function testConstructorRejectsZeroFee() public {
        vm.expectRevert(TuturFactory.InvalidFeeBps.selector);
        new TuturFactory(TREASURY, VALIDATOR_1, VALIDATOR_2, VALIDATOR_3, 0);
    }

    function testConstructorRejectsFeeAboveTenPercent() public {
        vm.expectRevert(TuturFactory.InvalidFeeBps.selector);
        new TuturFactory(TREASURY, VALIDATOR_1, VALIDATOR_2, VALIDATOR_3, 1_001);
    }

    function testTaskAtRejectsOutOfBoundsIndex() public {
        vm.expectRevert(TuturFactory.IndexOutOfBounds.selector);
        factory.taskAt(0);
    }

    function testOnlyConfiguredValidatorCanVote() public {
        TuturTask task = _submittedTask();

        vm.expectRevert(TuturTask.NotValidator.selector);
        vm.prank(address(0x9999));
        task.vote(true);
    }

    function testValidatorCannotVoteTwice() public {
        TuturTask task = _submittedTask();
        _vote(task, VALIDATOR_1, true);

        vm.expectRevert(TuturTask.AlreadyVoted.selector);
        vm.prank(VALIDATOR_1);
        task.vote(true);
    }

    function testContributorCannotSubmitTwice() public {
        TuturTask task = _createTask();
        vm.prank(CONTRIBUTOR);
        task.submitContribution(CONTENT_HASH, true);

        vm.expectRevert(TuturTask.InvalidStatus.selector);
        vm.prank(address(0x1003));
        task.submitContribution(keccak256("second"), true);
    }

    function testSponsorCannotSubmitContribution() public {
        TuturTask task = _createTask();

        vm.expectRevert(TuturTask.SponsorCannotContribute.selector);
        vm.prank(SPONSOR);
        task.submitContribution(CONTENT_HASH, true);
    }

    function testSubmissionRequiresTermsAcknowledgement() public {
        TuturTask task = _createTask();

        vm.expectRevert(TuturTask.TermsNotAccepted.selector);
        vm.prank(CONTRIBUTOR);
        task.submitContribution(CONTENT_HASH, false);
    }

    function testSubmissionRejectsZeroContentHash() public {
        TuturTask task = _createTask();

        vm.expectRevert(TuturTask.InvalidContentHash.selector);
        vm.prank(CONTRIBUTOR);
        task.submitContribution(bytes32(0), true);
    }

    function testTwoApprovalsPayContributorAndTreasury() public {
        TuturTask task = _submittedTask();
        uint256 contributorBalanceBefore = CONTRIBUTOR.balance;
        uint256 treasuryBalanceBefore = TREASURY.balance;

        _vote(task, VALIDATOR_1, true);
        _vote(task, VALIDATOR_2, true);

        assertEq(uint256(task.status()), uint256(TuturTask.Status.Paid));
        assertEq(CONTRIBUTOR.balance - contributorBalanceBefore, REWARD);
        assertEq(TREASURY.balance - treasuryBalanceBefore, FEE);
        assertEq(address(task).balance, 0);
    }

    function testTwoRejectionsRefundFullEscrowToSponsor() public {
        TuturTask task = _submittedTask();
        uint256 sponsorBalanceBefore = SPONSOR.balance;

        _vote(task, VALIDATOR_1, false);
        _vote(task, VALIDATOR_2, false);

        assertEq(uint256(task.status()), uint256(TuturTask.Status.Rejected));
        assertEq(SPONSOR.balance - sponsorBalanceBefore, TOTAL);
        assertEq(address(task).balance, 0);
    }

    function testRefundAfterDeadlineWhenTaskIsOpen() public {
        TuturTask task = _createTask();
        uint256 sponsorBalanceBefore = SPONSOR.balance;
        vm.warp(uint256(task.deadline()) + 1);

        task.refundAfterDeadline();

        assertEq(uint256(task.status()), uint256(TuturTask.Status.Refunded));
        assertEq(SPONSOR.balance - sponsorBalanceBefore, TOTAL);
        assertEq(address(task).balance, 0);
    }

    function testRefundAfterDeadlineWhenContributionIsPending() public {
        TuturTask task = _submittedTask();
        uint256 sponsorBalanceBefore = SPONSOR.balance;
        vm.warp(uint256(task.deadline()) + 1);

        task.refundAfterDeadline();

        assertEq(uint256(task.status()), uint256(TuturTask.Status.Refunded));
        assertEq(SPONSOR.balance - sponsorBalanceBefore, TOTAL);
    }

    function testRefundCannotHappenBeforeDeadline() public {
        TuturTask task = _createTask();

        vm.expectRevert(TuturTask.DeadlineNotPassed.selector);
        task.refundAfterDeadline();
    }

    function testSubmissionCannotHappenAtDeadline() public {
        TuturTask task = _createTask();
        vm.warp(task.deadline());

        vm.expectRevert(TuturTask.DeadlinePassed.selector);
        vm.prank(CONTRIBUTOR);
        task.submitContribution(CONTENT_HASH, true);
    }

    function testVotingCannotHappenAtDeadline() public {
        TuturTask task = _submittedTask();
        vm.warp(task.deadline());

        vm.expectRevert(TuturTask.DeadlinePassed.selector);
        vm.prank(VALIDATOR_1);
        task.vote(true);
    }

    function testPayoutTransferFailureRevertsStateAndVote() public {
        RejectingReceiver rejectingTreasury = new RejectingReceiver();
        TuturFactory rejectingFactory = new TuturFactory(
            address(rejectingTreasury), VALIDATOR_1, VALIDATOR_2, VALIDATOR_3, 800
        );
        vm.prank(SPONSOR);
        TuturTask task = TuturTask(
            payable(
                rejectingFactory.createTask{value: TOTAL}(
                    METADATA_HASH, REWARD, _deadline()
                )
            )
        );
        vm.prank(CONTRIBUTOR);
        task.submitContribution(CONTENT_HASH, true);
        _vote(task, VALIDATOR_1, true);
        uint256 contributorBalanceBefore = CONTRIBUTOR.balance;

        vm.expectRevert(TuturTask.TransferFailed.selector);
        vm.prank(VALIDATOR_2);
        task.vote(true);

        assertEq(uint256(task.status()), uint256(TuturTask.Status.Submitted));
        assertEq(task.approvals(), 1);
        assertEq(task.hasVoted(VALIDATOR_2), false);
        assertEq(CONTRIBUTOR.balance, contributorBalanceBefore);
        assertEq(address(task).balance, TOTAL);
    }

    function testTerminalTaskCannotBeRefundedAgain() public {
        TuturTask task = _submittedTask();
        _vote(task, VALIDATOR_1, true);
        _vote(task, VALIDATOR_2, true);
        vm.warp(uint256(task.deadline()) + 1);

        vm.expectRevert(TuturTask.InvalidStatus.selector);
        task.refundAfterDeadline();
    }

    function _createTask() private returns (TuturTask task) {
        vm.prank(SPONSOR);
        task = TuturTask(
            payable(factory.createTask{value: TOTAL}(METADATA_HASH, REWARD, _deadline()))
        );
    }

    function _submittedTask() private returns (TuturTask task) {
        task = _createTask();
        vm.prank(CONTRIBUTOR);
        task.submitContribution(CONTENT_HASH, true);
    }

    function _vote(TuturTask task, address validator, bool approve) private {
        vm.prank(validator);
        task.vote(approve);
    }

    function _deadline() private view returns (uint64) {
        return uint64(block.timestamp + 2 days);
    }

    function assertEq(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint values differ");
    }

    function assertEq(address actual, address expected) private pure {
        require(actual == expected, "addresses differ");
    }

    function assertEq(bytes32 actual, bytes32 expected) private pure {
        require(actual == expected, "hashes differ");
    }

    function assertEq(bool actual, bool expected) private pure {
        require(actual == expected, "bool values differ");
    }
}

contract RejectingReceiver {
    receive() external payable {
        revert("reject transfer");
    }
}
