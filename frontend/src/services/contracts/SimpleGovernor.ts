import type {
  BigNumberish,
  ContractTransactionResponse,
  Signer,
  Provider,
  Overrides,
} from 'ethers';
import { Contract } from 'ethers';

export interface ChainProposal {
  id: bigint;
  proposer: string;
  descriptionHash: string;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  quorum: bigint;
  eta: bigint;
  queued: boolean;
  executed: boolean;
}

const ABI = [
  'function proposalCount() view returns (uint256)',
  'function votingDelay() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function proposalQuorum() view returns (uint256)',
  'function minDelay() view returns (uint256)',
  'function hasVoted(uint256 proposalId, address voter) view returns (bool)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, bytes32 descriptionHash, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 quorum, uint256 eta, bool queued, bool executed))',
  'function proposalActions(uint256 proposalId) view returns (address[] targets, uint256[] values, bytes[] calldatas)',
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
  'function castVote(uint256 proposalId, bool support)',
  'function queue(uint256 proposalId)',
  'function execute(uint256 proposalId) payable',
];

export class SimpleGovernor {
  readonly contract: Contract;
  readonly address: string;
  readonly signerOrProvider: Signer | Provider;

  constructor(address: string, signerOrProvider: Signer | Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    this.contract = new Contract(address, ABI, signerOrProvider);
  }

  connect(signerOrProvider: Signer | Provider): SimpleGovernor {
    return new SimpleGovernor(this.address, signerOrProvider);
  }

  async proposalCount(overrides?: Overrides): Promise<bigint> {
    return this.contract.proposalCount(overrides ?? {});
  }

  async votingDelay(overrides?: Overrides): Promise<bigint> {
    return this.contract.votingDelay(overrides ?? {});
  }

  async votingPeriod(overrides?: Overrides): Promise<bigint> {
    return this.contract.votingPeriod(overrides ?? {});
  }

  async proposalQuorum(overrides?: Overrides): Promise<bigint> {
    return this.contract.proposalQuorum(overrides ?? {});
  }

  async minDelay(overrides?: Overrides): Promise<bigint> {
    return this.contract.minDelay(overrides ?? {});
  }

  async getProposal(proposalId: BigNumberish, overrides?: Overrides): Promise<ChainProposal> {
    return this.contract.getProposal(proposalId, overrides ?? {});
  }

  async proposalActions(
    proposalId: BigNumberish,
    overrides?: Overrides
  ): Promise<{ targets: string[]; values: bigint[]; calldatas: string[] }> {
    const [targets, values, calldatas] = await this.contract.proposalActions(proposalId, overrides ?? {});
    return { targets, values, calldatas };
  }

  async state(proposalId: BigNumberish, overrides?: Overrides): Promise<number> {
    const s = await this.contract.state(proposalId, overrides ?? {});
    return Number(s);
  }

  async hasVoted(proposalId: BigNumberish, voter: string, overrides?: Overrides): Promise<boolean> {
    return this.contract.hasVoted(proposalId, voter, overrides ?? {});
  }

  async propose(
    targets: string[],
    values: BigNumberish[],
    calldatas: string[],
    description: string,
    overrides?: Overrides & { from?: string }
  ): Promise<{ tx: ContractTransactionResponse; wait: () => Promise<unknown> }> {
    const tx = await this.contract.propose(targets, values, calldatas, description, overrides ?? {});
    return { tx, wait: () => tx.wait() };
  }

  async castVote(
    proposalId: BigNumberish,
    support: boolean,
    overrides?: Overrides & { from?: string }
  ): Promise<{ tx: ContractTransactionResponse; wait: () => Promise<unknown> }> {
    const tx = await this.contract.castVote(proposalId, support, overrides ?? {});
    return { tx, wait: () => tx.wait() };
  }

  async queue(
    proposalId: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{ tx: ContractTransactionResponse; wait: () => Promise<unknown> }> {
    const tx = await this.contract.queue(proposalId, overrides ?? {});
    return { tx, wait: () => tx.wait() };
  }

  async execute(
    proposalId: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{ tx: ContractTransactionResponse; wait: () => Promise<unknown> }> {
    const tx = await this.contract.execute(proposalId, overrides ?? {});
    return { tx, wait: () => tx.wait() };
  }
}
