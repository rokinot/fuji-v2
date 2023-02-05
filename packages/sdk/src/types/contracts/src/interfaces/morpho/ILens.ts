/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { Fragment, FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { Call } from "@hovoh/ethcall";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../../../common";

export interface ILensInterface extends utils.Interface {
  functions: {
    "getAverageBorrowRatePerBlock(address)": FunctionFragment;
    "getAverageBorrowRatePerYear(address)": FunctionFragment;
    "getAverageSupplyRatePerBlock(address)": FunctionFragment;
    "getAverageSupplyRatePerYear(address)": FunctionFragment;
    "getCurrentBorrowBalanceInOf(address,address)": FunctionFragment;
    "getCurrentSupplyBalanceInOf(address,address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getAverageBorrowRatePerBlock"
      | "getAverageBorrowRatePerYear"
      | "getAverageSupplyRatePerBlock"
      | "getAverageSupplyRatePerYear"
      | "getCurrentBorrowBalanceInOf"
      | "getCurrentSupplyBalanceInOf"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getAverageBorrowRatePerBlock",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getAverageBorrowRatePerYear",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getAverageSupplyRatePerBlock",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getAverageSupplyRatePerYear",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getCurrentBorrowBalanceInOf",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getCurrentSupplyBalanceInOf",
    values: [string, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "getAverageBorrowRatePerBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAverageBorrowRatePerYear",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAverageSupplyRatePerBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAverageSupplyRatePerYear",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getCurrentBorrowBalanceInOf",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getCurrentSupplyBalanceInOf",
    data: BytesLike
  ): Result;

  events: {};
}

export interface ILens extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ILensInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getAverageBorrowRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgBorrowRatePerBlock: BigNumber;
        p2pBorrowAmount: BigNumber;
        poolBorrowAmount: BigNumber;
      }
    >;

    getAverageBorrowRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgBorrowRatePerYear: BigNumber;
        p2pBorrowAmount: BigNumber;
        poolBorrowAmount: BigNumber;
      }
    >;

    getAverageSupplyRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgSupplyRatePerBlock: BigNumber;
        p2pSupplyAmount: BigNumber;
        poolSupplyAmount: BigNumber;
      }
    >;

    getAverageSupplyRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgSupplyRatePerYear: BigNumber;
        p2pSupplyAmount: BigNumber;
        poolSupplyAmount: BigNumber;
      }
    >;

    getCurrentBorrowBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        balanceOnPool: BigNumber;
        balanceInP2P: BigNumber;
        totalBalance: BigNumber;
      }
    >;

    getCurrentSupplyBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        balanceOnPool: BigNumber;
        balanceInP2P: BigNumber;
        totalBalance: BigNumber;
      }
    >;
  };

  getAverageBorrowRatePerBlock(
    _poolToken: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      avgBorrowRatePerBlock: BigNumber;
      p2pBorrowAmount: BigNumber;
      poolBorrowAmount: BigNumber;
    }
  >;

  getAverageBorrowRatePerYear(
    _poolToken: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      avgBorrowRatePerYear: BigNumber;
      p2pBorrowAmount: BigNumber;
      poolBorrowAmount: BigNumber;
    }
  >;

  getAverageSupplyRatePerBlock(
    _poolToken: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      avgSupplyRatePerBlock: BigNumber;
      p2pSupplyAmount: BigNumber;
      poolSupplyAmount: BigNumber;
    }
  >;

  getAverageSupplyRatePerYear(
    _poolToken: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      avgSupplyRatePerYear: BigNumber;
      p2pSupplyAmount: BigNumber;
      poolSupplyAmount: BigNumber;
    }
  >;

  getCurrentBorrowBalanceInOf(
    _poolToken: string,
    _user: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      balanceOnPool: BigNumber;
      balanceInP2P: BigNumber;
      totalBalance: BigNumber;
    }
  >;

  getCurrentSupplyBalanceInOf(
    _poolToken: string,
    _user: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      balanceOnPool: BigNumber;
      balanceInP2P: BigNumber;
      totalBalance: BigNumber;
    }
  >;

  callStatic: {
    getAverageBorrowRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgBorrowRatePerBlock: BigNumber;
        p2pBorrowAmount: BigNumber;
        poolBorrowAmount: BigNumber;
      }
    >;

    getAverageBorrowRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgBorrowRatePerYear: BigNumber;
        p2pBorrowAmount: BigNumber;
        poolBorrowAmount: BigNumber;
      }
    >;

    getAverageSupplyRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgSupplyRatePerBlock: BigNumber;
        p2pSupplyAmount: BigNumber;
        poolSupplyAmount: BigNumber;
      }
    >;

    getAverageSupplyRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        avgSupplyRatePerYear: BigNumber;
        p2pSupplyAmount: BigNumber;
        poolSupplyAmount: BigNumber;
      }
    >;

    getCurrentBorrowBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        balanceOnPool: BigNumber;
        balanceInP2P: BigNumber;
        totalBalance: BigNumber;
      }
    >;

    getCurrentSupplyBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        balanceOnPool: BigNumber;
        balanceInP2P: BigNumber;
        totalBalance: BigNumber;
      }
    >;
  };

  filters: {};

  estimateGas: {
    getAverageBorrowRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAverageBorrowRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAverageSupplyRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAverageSupplyRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getCurrentBorrowBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getCurrentSupplyBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getAverageBorrowRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAverageBorrowRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAverageSupplyRatePerBlock(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAverageSupplyRatePerYear(
      _poolToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getCurrentBorrowBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getCurrentSupplyBalanceInOf(
      _poolToken: string,
      _user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}

export interface ILensMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  getAverageBorrowRatePerBlock(
    _poolToken: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      avgBorrowRatePerBlock: BigNumber;
      p2pBorrowAmount: BigNumber;
      poolBorrowAmount: BigNumber;
    }
  >;

  getAverageBorrowRatePerYear(
    _poolToken: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      avgBorrowRatePerYear: BigNumber;
      p2pBorrowAmount: BigNumber;
      poolBorrowAmount: BigNumber;
    }
  >;

  getAverageSupplyRatePerBlock(
    _poolToken: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      avgSupplyRatePerBlock: BigNumber;
      p2pSupplyAmount: BigNumber;
      poolSupplyAmount: BigNumber;
    }
  >;

  getAverageSupplyRatePerYear(
    _poolToken: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      avgSupplyRatePerYear: BigNumber;
      p2pSupplyAmount: BigNumber;
      poolSupplyAmount: BigNumber;
    }
  >;

  getCurrentBorrowBalanceInOf(
    _poolToken: string,
    _user: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      balanceOnPool: BigNumber;
      balanceInP2P: BigNumber;
      totalBalance: BigNumber;
    }
  >;

  getCurrentSupplyBalanceInOf(
    _poolToken: string,
    _user: string,
    overrides?: CallOverrides
  ): Call<
    [BigNumber, BigNumber, BigNumber] & {
      balanceOnPool: BigNumber;
      balanceInP2P: BigNumber;
      totalBalance: BigNumber;
    }
  >;
}
