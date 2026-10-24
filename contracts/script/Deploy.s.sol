// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/TuturFactory.sol";

/// Usage (operator signs with an ENCRYPTED KEYSTORE, never a raw key in env/history):
///   cast wallet import tutur-burner --interactive
///   TREASURY=0x.. VALIDATOR1=0x.. VALIDATOR2=0x.. VALIDATOR3=0x.. \
///   forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz \
///     --account tutur-burner --broadcast
/// Only PUBLIC addresses are read from the environment.
contract Deploy is Script {
    function run() external returns (TuturFactory factory) {
        address treasury = vm.envAddress("TREASURY");
        address v1 = vm.envAddress("VALIDATOR1");
        address v2 = vm.envAddress("VALIDATOR2");
        address v3 = vm.envAddress("VALIDATOR3");
        vm.startBroadcast();
        factory = new TuturFactory(treasury, v1, v2, v3, 800);
        vm.stopBroadcast();
        console2.log("TuturFactory deployed at:", address(factory));
    }
}
