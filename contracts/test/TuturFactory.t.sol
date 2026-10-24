// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/TuturFactory.sol";

contract RejectingReceiver {
    receive() external payable { revert("no"); }
}

contract TuturTest is Test {
    TuturFactory factory;
    address treasury = makeAddr("treasury");
    address v1 = makeAddr("v1");
    address v2 = makeAddr("v2");
    address v3 = makeAddr("v3");
    address sponsor = makeAddr("sponsor");
    address contributor = makeAddr("contributor");
    address stranger = makeAddr("stranger");

    uint256 constant REWARD = 1 ether;
    uint256 constant FEE = 0.08 ether;
    bytes32 constant META = keccak256("meta");
    bytes32 constant HASH = keccak256("hello");

    function setUp() public {
        factory = new TuturFactory(treasury, v1, v2, v3, 800);
        vm.deal(sponsor, 100 ether);
    }

    function _create() internal returns (TuturTask t) {
        vm.prank(sponsor);
        t = TuturTask(payable(factory.createTask{value: REWARD + FEE}(META, REWARD, uint64(block.timestamp + 1 days))));
    }

    function _submitted() internal returns (TuturTask t) {
        t = _create();
        vm.prank(contributor);
        t.submitContribution(HASH, true);
    }

    // ---- factory ----
    function test_feeCalculation() public view {
        assertEq(factory.quoteFee(1 ether), 0.08 ether);
        assertEq(factory.feeBps(), 800);
    }

    function test_createTask_locksEscrow() public {
        TuturTask t = _create();
        assertEq(address(t).balance, REWARD + FEE);
        assertEq(t.rewardAmount(), REWARD);
        assertEq(t.feeAmount(), FEE);
        assertEq(t.sponsor(), sponsor);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Open));
        assertEq(factory.getTaskCount(), 1);
        assertEq(factory.taskAt(0), address(t));
    }

    function test_createTask_emitsEvent() public {
        vm.expectEmit(false, true, true, true);
        emit TuturFactory.TaskCreated(address(0), sponsor, META, REWARD, FEE, uint64(block.timestamp + 1 days));
        _create();
    }

    function test_createTask_wrongPayment() public {
        uint64 dl = uint64(block.timestamp + 1 days);
        vm.startPrank(sponsor);
        vm.expectRevert(TuturFactory.WrongPayment.selector);
        factory.createTask{value: REWARD}(META, REWARD, dl);
        vm.expectRevert(TuturFactory.WrongPayment.selector);
        factory.createTask{value: REWARD + FEE + 1}(META, REWARD, dl);
        vm.stopPrank();
    }

    function test_createTask_invalidInputs() public {
        uint64 dl = uint64(block.timestamp + 1 days);
        vm.startPrank(sponsor);
        vm.expectRevert(TuturFactory.ZeroReward.selector);
        factory.createTask{value: 0}(META, 0, dl);
        vm.expectRevert(TuturFactory.ZeroMetadataHash.selector);
        factory.createTask{value: REWARD + FEE}(bytes32(0), REWARD, dl);
        vm.expectRevert(TuturFactory.InvalidDeadline.selector);
        factory.createTask{value: REWARD + FEE}(META, REWARD, uint64(block.timestamp));
        vm.stopPrank();
    }

    function test_createTask_zeroFeeRounding() public {
        uint64 dl = uint64(block.timestamp + 1 days);
        vm.prank(sponsor);
        vm.expectRevert(TuturFactory.ZeroFee.selector);
        factory.createTask{value: 10}(META, 10, dl); // 10*800/10000 = 0
    }

    function test_constructor_validation() public {
        vm.expectRevert(TuturFactory.ZeroAddress.selector);
        new TuturFactory(address(0), v1, v2, v3, 800);
        vm.expectRevert(TuturFactory.ZeroAddress.selector);
        new TuturFactory(treasury, address(0), v2, v3, 800);
        vm.expectRevert(TuturFactory.DuplicateValidators.selector);
        new TuturFactory(treasury, v1, v1, v3, 800);
        vm.expectRevert(TuturFactory.DuplicateValidators.selector);
        new TuturFactory(treasury, v1, v2, v1, 800);
        vm.expectRevert(TuturFactory.InvalidFee.selector);
        new TuturFactory(treasury, v1, v2, v3, 0);
        vm.expectRevert(TuturFactory.InvalidFee.selector);
        new TuturFactory(treasury, v1, v2, v3, 1001);
    }

    // ---- submission ----
    function test_submit_happy() public {
        TuturTask t = _submitted();
        assertEq(t.contributor(), contributor);
        assertEq(t.contributionHash(), HASH);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Submitted));
    }

    function test_submit_twiceReverts() public {
        TuturTask t = _submitted();
        vm.prank(stranger);
        vm.expectRevert(TuturTask.NotOpen.selector);
        t.submitContribution(keccak256("other"), true);
    }

    function test_submit_sponsorReverts() public {
        TuturTask t = _create();
        vm.prank(sponsor);
        vm.expectRevert(TuturTask.SponsorCannotContribute.selector);
        t.submitContribution(HASH, true);
    }

    function test_submit_requiresTerms() public {
        TuturTask t = _create();
        vm.prank(contributor);
        vm.expectRevert(TuturTask.TermsNotAccepted.selector);
        t.submitContribution(HASH, false);
    }

    function test_submit_zeroHash() public {
        TuturTask t = _create();
        vm.prank(contributor);
        vm.expectRevert(TuturTask.ZeroHash.selector);
        t.submitContribution(bytes32(0), true);
    }

    function test_submit_afterDeadline() public {
        TuturTask t = _create();
        vm.warp(block.timestamp + 2 days);
        vm.prank(contributor);
        vm.expectRevert(TuturTask.DeadlinePassed.selector);
        t.submitContribution(HASH, true);
    }

    // ---- voting ----
    function test_vote_onlyValidator() public {
        TuturTask t = _submitted();
        vm.prank(stranger);
        vm.expectRevert(TuturTask.NotValidator.selector);
        t.vote(true);
    }

    function test_vote_beforeSubmission() public {
        TuturTask t = _create();
        vm.prank(v1);
        vm.expectRevert(TuturTask.NotSubmitted.selector);
        t.vote(true);
    }

    function test_vote_noDoubleVote() public {
        TuturTask t = _submitted();
        vm.startPrank(v1);
        t.vote(true);
        vm.expectRevert(TuturTask.AlreadyVoted.selector);
        t.vote(true);
        vm.stopPrank();
    }

    function test_vote_afterDeadline() public {
        TuturTask t = _submitted();
        vm.warp(block.timestamp + 2 days);
        vm.prank(v1);
        vm.expectRevert(TuturTask.DeadlinePassed.selector);
        t.vote(true);
    }

    function test_twoApprovals_payExactly() public {
        TuturTask t = _submitted();
        vm.prank(v1);
        t.vote(true);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Submitted));
        vm.prank(v2);
        t.vote(true);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Paid));
        assertEq(contributor.balance, REWARD);
        assertEq(treasury.balance, FEE);
        assertEq(address(t).balance, 0);
        // no further votes or payouts
        vm.prank(v3);
        vm.expectRevert(TuturTask.NotSubmitted.selector);
        t.vote(true);
        vm.expectRevert(TuturTask.AlreadyFinal.selector);
        t.refundAfterDeadline();
    }

    function test_twoRejections_refundFull() public {
        TuturTask t = _submitted();
        uint256 before = sponsor.balance;
        vm.prank(v1);
        t.vote(false);
        vm.prank(v3);
        t.vote(false);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Rejected));
        assertEq(sponsor.balance, before + REWARD + FEE);
        assertEq(address(t).balance, 0);
        assertEq(contributor.balance, 0);
        assertEq(treasury.balance, 0);
    }

    function test_splitVotes_thirdDecides() public {
        TuturTask t = _submitted();
        vm.prank(v1);
        t.vote(true);
        vm.prank(v2);
        t.vote(false);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Submitted));
        vm.prank(v3);
        t.vote(true);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Paid));
        assertEq(contributor.balance, REWARD);
    }

    // ---- expiry ----
    function test_refund_notEarly() public {
        TuturTask t = _submitted();
        vm.expectRevert(TuturTask.DeadlineNotPassed.selector);
        t.refundAfterDeadline();
    }

    function test_refund_openExpired() public {
        TuturTask t = _create();
        uint256 before = sponsor.balance;
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(stranger);
        t.refundAfterDeadline();
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Refunded));
        assertEq(sponsor.balance, before + REWARD + FEE);
        vm.expectRevert(TuturTask.AlreadyFinal.selector);
        t.refundAfterDeadline();
    }

    function test_refund_submittedExpired() public {
        TuturTask t = _submitted();
        uint256 before = sponsor.balance;
        vm.warp(block.timestamp + 1 days + 1);
        t.refundAfterDeadline();
        assertEq(sponsor.balance, before + REWARD + FEE);
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Refunded));
    }

    // ---- atomicity ----
    function test_failedTransfer_revertsAtomically() public {
        RejectingReceiver bad = new RejectingReceiver();
        vm.prank(sponsor);
        TuturTask t = TuturTask(
            payable(factory.createTask{value: REWARD + FEE}(META, REWARD, uint64(block.timestamp + 1 days)))
        );
        vm.prank(address(bad));
        t.submitContribution(HASH, true);
        vm.prank(v1);
        t.vote(true);
        vm.prank(v2);
        vm.expectRevert(TuturTask.TransferFailed.selector);
        t.vote(true);
        // state fully rolled back
        assertEq(uint8(t.status()), uint8(TuturTask.Status.Submitted));
        assertEq(t.approvals(), 1);
        assertFalse(t.hasVoted(v2));
        assertEq(address(t).balance, REWARD + FEE);
    }

    // ---- isolation ----
    function test_tasksAreIndependent() public {
        TuturTask a = _create();
        TuturTask b = _create();
        vm.prank(contributor);
        a.submitContribution(HASH, true);
        assertEq(uint8(b.status()), uint8(TuturTask.Status.Open));
        assertEq(address(b).balance, REWARD + FEE);
        assertTrue(address(a) != address(b));
    }
}
