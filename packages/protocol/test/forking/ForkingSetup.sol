// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";

// How to add a new chain with its domain?
// 1. Add a domain ID. Domains originate from Connext (check their docs)
// 2. Create a fork and save it in "forks" mapping
// 3. Create a registry entry with addresses for reuiqred resources

contract ForkingSetup is CoreRoles, Test {
  uint32 public constant GOERLI_DOMAIN = 1735353714;
  uint32 public constant OPTIMISM_GOERLI_DOMAIN = 1735356532;
  uint32 public constant MUMBAI_DOMAIN = 9991;
  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 22222222; // TODO: replace with the real one

  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);

  uint32 originDomain;

  struct Registry {
    address weth;
    address usdc;
    address connext;
  }
  // domain => addresses registry

  mapping(uint256 => Registry) public registry;
  // domain => forkId
  mapping(uint256 => uint256) public forks;

  IVault public vault;
  Chief public chief;
  TimelockController public timelock;
  MockOracle mockOracle;

  address public collateralAsset;
  address public debtAsset;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");

    forks[GOERLI_DOMAIN] = vm.createFork("goerli");
    forks[OPTIMISM_GOERLI_DOMAIN] = vm.createFork("optimism_goerli");
    forks[MUMBAI_DOMAIN] = vm.createFork("mumbai");
    forks[MAINNET_DOMAIN] = vm.createFork("mainnet");
    forks[OPTIMISM_DOMAIN] = vm.createFork("optimism");

    Registry memory goerli = Registry({
      weth: 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6,
      usdc: address(0),
      connext: 0x99A784d082476E551E5fc918ce3d849f2b8e89B6
    });
    registry[GOERLI_DOMAIN] = goerli;

    Registry memory optimismGoerli = Registry({
      weth: 0x74c6FD7D2Bc6a8F0Ebd7D78321A95471b8C2B806,
      usdc: address(0),
      connext: 0x705791AD27229dd4CCf41b6720528AfE1bcC2910
    });
    registry[OPTIMISM_GOERLI_DOMAIN] = optimismGoerli;

    Registry memory mumbai = Registry({
      weth: 0xFD2AB41e083c75085807c4A65C0A14FDD93d55A9,
      usdc: address(0),
      connext: 0xfeBBcfe9a88aadefA6e305945F2d2011493B15b4
    });
    registry[MUMBAI_DOMAIN] = mumbai;

    Registry memory mainnet = Registry({
      weth: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
      usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
      connext: address(0)
    });
    registry[MAINNET_DOMAIN] = mainnet;

    Registry memory optimism = Registry({
      weth: 0x4200000000000000000000000000000000000006,
      usdc: 0x7F5c764cBc14f9669B88837ca1490cCa17c31607,
      connext: address(0)
    });
    registry[OPTIMISM_DOMAIN] = optimism;
  }

  function deploy(uint32 domain) public {
    Registry memory reg = registry[domain];
    if (reg.connext == address(0) && reg.weth == address(0) && reg.usdc == address(0)) {
      revert("No registry for this chain");
    }
    vm.selectFork(forks[domain]);

    originDomain = domain;

    if (reg.connext != address(0)) vm.label(reg.connext, "Connext");

    collateralAsset = reg.weth;
    vm.label(reg.weth, "ConnextWETH");

    if (reg.usdc == address(0)) {
      // mostly for testnets
      MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
      debtAsset = address(tDAI);
      vm.label(debtAsset, "testDAI");
    } else {
      debtAsset = reg.usdc;
      vm.label(debtAsset, "USDC");
    }

    // TODO: replace with real oracle
    mockOracle = new MockOracle();
    // WETH and DAI prices by Aug 12h 2022
    mockOracle.setPriceOf(collateralAsset, debtAsset, 528881643782407);
    mockOracle.setPriceOf(debtAsset, collateralAsset, 1889069940262927605990);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));
    // Grant this address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));

    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );
  }

  function _callWithTimelock(bytes memory sendData, IVault v) internal {
    timelock.schedule(address(v), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(v), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _setVaultProviders(IVault v, ILendingProvider[] memory providers) internal {
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers);
    _callWithTimelock(sendData, v);
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _getPermitBorrowArgs(
    address owner,
    uint256 ownerPrivateKey,
    address operator,
    uint256 borrowAmount,
    uint256 plusNonce,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      spender: operator,
      amount: borrowAmount,
      nonce: IVaultPermissions(vault_).nonces(owner) + plusNonce,
      deadline: deadline
    });
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      structHash
    );
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
  }
}
