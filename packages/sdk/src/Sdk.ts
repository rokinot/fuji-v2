import { BigNumber } from '@ethersproject/bignumber';
import { Signature } from '@ethersproject/bytes';
import { TransactionRequest } from '@ethersproject/providers';
import { Call } from '@hovoh/ethcall';
import invariant from 'tiny-invariant';

import {
  COLLATERAL_LIST,
  CONNEXT_DOMAIN,
  CONNEXT_ROUTER_ADDRESS,
  DEBT_LIST,
  VAULT_LIST,
} from './constants';
import { Address, ChainConnection, Currency, Token } from './entities';
import { BorrowingVault } from './entities/BorrowingVault';
import { ChainId, RouterAction, RoutingStep } from './enums';
import { encodeActionArgs } from './functions';
import {
  ChainConfig,
  PermitParams,
  RouterActionParams,
  RoutingStepDetails,
  XTransferParams,
  XTransferWithCallParams,
} from './types';
import { ConnextRouter__factory } from './types/contracts';

export class Sdk {
  /**
   * ChainConfig object containing Infura and Alchemy ids that
   * are used to create JsonRpcProviders.
   */
  private _configParams: ChainConfig;

  constructor(config: ChainConfig) {
    this._configParams = config;
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW, X_TRANSFER_WITH_CALL]
   *
   * @param params - array of actions
   */
  static needSignature(params: RouterActionParams[]): boolean {
    return !!params.find((p) => {
      if (p.action === RouterAction.X_TRANSFER_WITH_CALL) {
        return Sdk.needSignature(p.innerActions);
      }
      return (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      );
    });
  }

  /**
   * Static method to find PERMIT_BORROW or PERMIT_WITHDRAW action.
   *
   * @param params - array of actions
   */
  static findPermitAction(
    params: RouterActionParams[]
  ): PermitParams | undefined {
    for (const p of params) {
      if (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      )
        return p;
      if (p.action === RouterAction.X_TRANSFER_WITH_CALL) {
        return Sdk.findPermitAction(p.innerActions);
      }
    }

    return undefined;
  }

  /**
   * Retruns tokens that can be used as collateral on a specific chain.
   * Sets the connection of each token instance so that they are ready
   * to be used.
   *
   * @param chainId - ID of the chain
   */
  getCollateralForChain(chainId: ChainId): Token[] {
    return COLLATERAL_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
  }

  /**
   * Retruns tokens that can be borrowed on a specific chain.
   * Sets the connection of each token instance so that they are ready
   *
   * to be used.
   * @param chainId - ID of the chain
   */
  getDebtForChain(chainId: ChainId): Token[] {
    return DEBT_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
  }

  /**
   * Retruns the balance of account for a given currency,
   * both for native and token.
   *
   * @param currency - instance of {@link Currency}
   * @param account - user address, wrapped in {@link Address}
   */
  getBalanceFor(currency: Currency, account: Address): Promise<BigNumber> {
    return currency.setConnection(this._configParams).balanceOf(account);
  }

  /**
   * Retruns the allowance that an account has given to a router
   * for a given currency. If currency is native, it returns MaxUint256.
   *
   * @param currency - instance of {@link Currency}
   * @param account - user address, wrapped in {@link Address}
   */
  getAllowanceFor(currency: Currency, account: Address): Promise<BigNumber> {
    const router: Address = CONNEXT_ROUTER_ADDRESS[currency.chainId];
    return currency
      .setConnection(this._configParams)
      .allowance(account, router);
  }

  /**
   * Retruns the token balances of an address in a batch.
   * Throws an error if `chainId` is different from each `token.chainId`.
   *
   * @param tokens - array of {@link Token} from the same chain
   * @param account - user address, wrapped in {@link Address}
   * @param chainId - ID of the chain
   */
  getTokenBalancesFor(
    tokens: Token[],
    account: Address,
    chainId: ChainId
  ): Promise<BigNumber[]> {
    invariant(
      !tokens.find((t) => t.chainId !== chainId),
      'Token from a different chain!'
    );
    const { multicallRpcProvider } = ChainConnection.from(
      this._configParams,
      chainId
    );
    const balances = tokens
      .map((token) => token.setConnection(this._configParams))
      .map(
        (token) =>
          token.multicallContract?.balanceOf(account.value) as Call<BigNumber>
      );

    return multicallRpcProvider.all(balances);
  }

  /**
   * Retruns all vaults for a given combination of tokens and sets a connection for each of them.
   *
   * @remarks
   * The vaults are sorted after checks of the lowest borrow rate for the debt token.
   * If collateral and debt tokens are on the same chain, we privilage the vault
   * on the same chain even though it has a lowest borrow rate.
   *
   * @param collateral - collateral instance of {@link Token}
   * @param debt - debt instance of {@link Token}
   */
  async getBorrowingVaultsFor(
    collateral: Token,
    debt: Token
  ): Promise<BorrowingVault[]> {
    // TODO: sort by safety rating too
    // find all vaults with this pair
    const vaults = this._findVaultsByTokens(collateral, debt).map(
      (v: BorrowingVault) => v.setConnection(this._configParams)
    );

    const rates = await Promise.all(vaults.map((v) => v.getBorrowRate()));

    // and sort them by borrow rate
    const sorted = vaults
      .map((vault, i) => ({ vault, rate: rates[i] }))
      .sort((a, b) => (a.rate.lt(b.rate) ? -1 : 0))
      .map(({ vault }) => vault);

    if (collateral.chainId === debt.chainId) {
      // sort again to privilege vaults on the same chain
      sorted.sort((a) =>
        a.collateral.chainId === collateral.chainId ? -1 : 0
      );
    }

    return sorted;
  }

  /**
   * Prepares and returns 1) the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow; 2) the steps to be taken in order to
   * accomplish the operation; 3) the bridge fee; 4) the estimate time to process the tx
   * in seconds
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `this.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `this.getTxDetails` which is to be
   * used in ethers.sendTransaction.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token with which user starts the operation
   * @param tokenOut - token that user want to borrow
   * @param account - user address, wrapped in {@link Address}
   * @param deadline - timestamp for validity of permit (defaults to 24h starting from now)
   */
  async previewDepositAndBorrow(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
    account: Address,
    deadline?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 5 * 60;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account, deadline),
        vault.previewBorrow(amountOut, account),
      ];
    } else if (srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account, deadline),
        vault.previewBorrow(amountOut, account),
        this.previewXTransfer(destChainId, vault.debt, amountOut, account),
      ];
    } else if (destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        vault.previewDeposit(amountIn, connextRouter, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account, deadline),
        vault.previewBorrow(amountOut, account),
      ];
      actions = [
        this.previewXTransferWithCall(
          destChainId,
          tokenIn,
          amountIn,
          innerActions
        ),
      ];
    }

    const steps = await this._getRoutingStepsFor(
      vault,
      amountIn,
      amountOut,
      srcChainId,
      destChainId
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  /**
   * Prepares and returns the request to be passed to ethers.sendTransaction
   *
   * @remarks
   * It's recommended to obtain `actionParams` from this.previewDepositAndBorrow.
   * If there are any permit action, they have to be signed.
   *
   * @param actionParams - vault instance on which we want to open a position
   * @param srcChainId - ID of the chain from which the tx gets init
   * @param account - user address, wrapped in {@link Address}
   * @param signature - a signiture for the permit action (optional)
   */
  getTxDetails(
    actionParams: RouterActionParams[],
    srcChainId: ChainId,
    account: Address,
    signature?: Signature
  ): TransactionRequest {
    const _actionParams = actionParams.map((a) => ({ ...a }));
    const permitAction = Sdk.findPermitAction(_actionParams);

    if (permitAction && signature) {
      permitAction.v = signature.v;
      permitAction.r = signature.r;
      permitAction.s = signature.s;
    } else if (permitAction && !signature) {
      invariant(true, 'You need to sign the permit action first!');
    } else if (!permitAction && signature) {
      invariant(true, 'No permit action although there is a signature!');
    }

    const actions = _actionParams.map(({ action }) => BigNumber.from(action));
    const args = _actionParams.map(encodeActionArgs);
    const callData =
      ConnextRouter__factory.createInterface().encodeFunctionData('xBundle', [
        actions,
        args,
      ]);

    return {
      from: account.value,
      to: CONNEXT_ROUTER_ADDRESS[srcChainId].value,
      data: callData,
      chainId: srcChainId,
    };
  }

  previewXTransfer(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    receiver: Address
  ): XTransferParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
    invariant(destDomain, 'Chain is not available on Connext!');

    return {
      action: RouterAction.X_TRANSFER,
      destDomain,
      amount,
      asset: asset.address,
      receiver: receiver,
    };
  }

  previewXTransferWithCall(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    innerActions: RouterActionParams[]
  ): XTransferWithCallParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
    invariant(destDomain, `Chain ${destChainId} is not available on Connext!`);

    return {
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: asset.address,
      innerActions,
    };
  }

  /**
   * Prepares and returns the steps that will be taken
   * in order to accomplish an operation.
   * IMPORTANT: only works for depositAndBorrow
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param srcChainId - chain ID from which the tx is initated
   * @param destChainId - chain ID where user wants their borrowed amount disbursed
   */
  private async _getRoutingStepsFor(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    destChainId: ChainId
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: srcChainId,
        tokenSym: vault.collateral.symbol,
      },
    ];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: vault.chainId,
          tokenSym: vault.collateral.symbol,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: vault.chainId,
          tokenSym: vault.debt.symbol,
          lendingProvider: activeProvider,
        }
      );
    } else if (srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: vault.chainId,
          tokenSym: vault.collateral.symbol,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: vault.chainId,
          tokenSym: vault.debt.symbol,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: destChainId,
          tokenSym: vault.debt.symbol,
        }
      );
    } else if (destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountIn,
          chainId: destChainId,
          tokenSym: vault.collateral.symbol,
        },
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: vault.chainId,
          tokenSym: vault.collateral.symbol,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: vault.chainId,
          tokenSym: vault.debt.symbol,
          lendingProvider: activeProvider,
        }
      );
    }
    steps.push({
      step: RoutingStep.END,
      amount: amountOut,
      chainId: destChainId,
      tokenSym: vault.debt.symbol,
    });

    return steps;
  }

  private _findVaultsByTokens(
    collateral: Token,
    debt: Token
  ): BorrowingVault[] {
    const collateralSym = collateral.symbol;
    const debtSym = debt.symbol;

    return Object.entries(VAULT_LIST)
      .map(([, list]) => list)
      .reduce((acc, list) => {
        const vaults = list.filter(
          (v: BorrowingVault) =>
            v.collateral.symbol === collateralSym && v.debt.symbol === debtSym
        );
        return [...acc, ...vaults];
      }, []);
  }
}
