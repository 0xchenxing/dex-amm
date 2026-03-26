// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleGovernor
 * @author DEX-AMM
 * @notice 单一治理合约：提案、投票、内置延迟排队与执行。
 * @dev 部署后将 SwapFactory.feeToSetter 设为本合约地址，即可通过提案治理 setFeeTo / setFeeToSetter。
 *      流程：propose -> castVote -> queue -> (等待 minDelay) -> execute。
 *      投票模型：每地址每提案 1 票；通过条件为 forVotes > againstVotes 且 forVotes >= quorum。 
 */
contract SimpleGovernor {
    /// @notice 提案生命周期状态
    /// @param Pending   未到开始投票区块
    /// @param Active    投票进行中
    /// @param Defeated  投票结束但未通过（反对≥赞成或未达 quorum）
    /// @param Succeeded 投票通过，尚未排队
    /// @param Queued    已排队，等待执行时间窗口
    /// @param Executed  已执行
    /// @param Expired   排队后超过 gracePeriod 未执行
    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Executed, Expired }

    /// @notice 单条提案的链上存储
    /// @param id            提案编号
    /// @param proposer      提案人地址
    /// @param descriptionHash 描述字符串的 keccak256 哈希
    /// @param startBlock    开始投票的区块号
    /// @param endBlock      结束投票的区块号
    /// @param forVotes      赞成票数
    /// @param againstVotes  反对票数
    /// @param quorum        通过所需最小赞成票数
    /// @param eta           排队后的预计执行时间戳（queue 时设为 block.timestamp + minDelay）
    /// @param queued        是否已调用 queue
    /// @param executed      是否已执行
    struct Proposal {
        uint256 id;
        address proposer;
        bytes32 descriptionHash;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 quorum;
        uint256 eta;
        bool queued;
        bool executed;
    }

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        string description
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event ProposalExecuted(uint256 indexed proposalId);

    /// @notice 已创建的提案总数，也是下一个提案的 id
    uint256 public proposalCount;
    /// @notice 提案创建后延迟多少区块开始投票
    uint256 public immutable votingDelay;
    /// @notice 投票持续多少区块
    uint256 public immutable votingPeriod;
    /// @notice 通过所需最小赞成票数（法定人数）
    uint256 public immutable proposalQuorum;
    /// @notice 排队后至少等待多少秒才能执行
    uint256 public immutable minDelay;
    /// @notice 排队后若超过 eta + gracePeriod 未执行则视为过期，不可再执行
    uint256 public constant gracePeriod = 7 days;

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => address[]) private _proposalTargets;
    mapping(uint256 => uint256[]) private _proposalValues;
    mapping(uint256 => bytes[]) private _proposalCalldatas;
    /// @notice 某提案下某地址是否已投票
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /**
     * @notice 初始化治理参数，部署后不可更改
     * @param _votingDelay   创建提案后延迟多少区块开始投票
     * @param _votingPeriod 投票持续区块数
     * @param _proposalQuorum 通过所需最小赞成票数
     * @param _minDelay      queue 后至少等待秒数才能 execute
     */
    constructor(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalQuorum,
        uint256 _minDelay
    ) {
        require(_votingPeriod > 0, "Governor: INVALID_VOTING_PERIOD");
        require(_proposalQuorum > 0, "Governor: INVALID_QUORUM");
        require(_minDelay > 0, "Governor: INVALID_DELAY");
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalQuorum = _proposalQuorum;
        minDelay = _minDelay;
    }

    /**
     * @notice 创建一条新提案
     * @param targets    要调用的目标合约地址列表
     * @param values     每次调用附带的 ETH 数量（通常为 0）
     * @param calldatas  每次调用的 calldata（如 abi.encodeWithSelector(setFeeTo.selector, addr)）
     * @param description 人类可读的描述，仅用于事件与链下展示
     * @return proposalId 新提案的 id
     */
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (uint256 proposalId) {
        uint256 actions = targets.length;
        require(actions > 0, "Governor: EMPTY_PROPOSAL");
        require(actions == values.length && actions == calldatas.length, "Governor: LENGTH_MISMATCH");
        require(actions <= 10, "Governor: TOO_MANY_ACTIONS");

        proposalId = ++proposalCount;
        Proposal storage p = _proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.descriptionHash = keccak256(bytes(description));
        p.startBlock = block.number + votingDelay;
        p.endBlock = p.startBlock + votingPeriod;
        p.quorum = proposalQuorum;

        for (uint256 i = 0; i < actions; i++) {
            require(targets[i] != address(0), "Governor: ZERO_TARGET");
            _proposalTargets[proposalId].push(targets[i]);
            _proposalValues[proposalId].push(values[i]);
            _proposalCalldatas[proposalId].push(calldatas[i]);
        }

        emit ProposalCreated(proposalId, msg.sender, targets, values, description);
    }

    /**
     * @notice 对提案投票，每地址每提案 1 票
     * @param proposalId 提案 id
     * @param support    true 赞成，false 反对
     */
    function castVote(uint256 proposalId, bool support) external {
        require(state(proposalId) == ProposalState.Active, "Governor: VOTING_CLOSED");
        require(!hasVoted[proposalId][msg.sender], "Governor: ALREADY_VOTED");

        hasVoted[proposalId][msg.sender] = true;
        Proposal storage p = _proposals[proposalId];
        if (support) p.forVotes += 1;
        else p.againstVotes += 1;

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    /**
     * @notice 将已通过的提案加入执行队列，并设置执行时间 eta = now + minDelay
     * @param proposalId 提案 id
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Governor: NOT_SUCCEEDED");
        Proposal storage p = _proposals[proposalId];
        p.queued = true;
        p.eta = block.timestamp + minDelay;
        emit ProposalQueued(proposalId, p.eta);
    }

    /**
     * @notice 在时间窗口 [eta, eta + gracePeriod] 内执行提案中的全部调用
     * @param proposalId 提案 id
     */
    function execute(uint256 proposalId) external payable {
        require(state(proposalId) == ProposalState.Queued, "Governor: NOT_QUEUED");

        Proposal storage p = _proposals[proposalId];
        require(block.timestamp >= p.eta, "Governor: ETA_NOT_REACHED");
        p.executed = true;

        address[] storage targets = _proposalTargets[proposalId];
        uint256[] storage values = _proposalValues[proposalId];
        bytes[] storage calldatas = _proposalCalldatas[proposalId];

        for (uint256 i = 0; i < targets.length; i++) {
            (bool ok, ) = targets[i].call{value: values[i]}(calldatas[i]);
            require(ok, "Governor: EXECUTION_FAILED");
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice 查询提案当前状态
     * @param proposalId 提案 id
     * @return 枚举 ProposalState（0=Pending, 1=Active, 2=Defeated, 3=Succeeded, 4=Queued, 5=Executed, 6=Expired）
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        if (p.id == 0) return ProposalState.Pending;

        if (p.executed) return ProposalState.Executed;
        if (block.number <= p.startBlock) return ProposalState.Pending;
        if (block.number <= p.endBlock) return ProposalState.Active;
        if (p.forVotes <= p.againstVotes || p.forVotes < p.quorum) return ProposalState.Defeated;
        if (!p.queued) return ProposalState.Succeeded;
        if (block.timestamp > p.eta + gracePeriod) return ProposalState.Expired;
        if (block.timestamp >= p.eta) return ProposalState.Queued;
        return ProposalState.Queued;
    }

    /**
     * @notice 获取提案的完整结构（只读）
     * @param proposalId 提案 id
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        Proposal storage p = _proposals[proposalId];
        require(p.id != 0, "Governor: UNKNOWN_PROPOSAL");
        return p;
    }

    /**
     * @notice 获取提案要执行的动作：目标地址、附带的 ETH、calldata
     * @param proposalId 提案 id
     */
    function proposalActions(uint256 proposalId)
        external
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        require(_proposals[proposalId].id != 0, "Governor: UNKNOWN_PROPOSAL");
        return (_proposalTargets[proposalId], _proposalValues[proposalId], _proposalCalldatas[proposalId]);
    }

    /// @notice 允许合约接收 ETH（若提案中有 value > 0 的调用，execute 时需转入足够 ETH）
    receive() external payable {}
}
