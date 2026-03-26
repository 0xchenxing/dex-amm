import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { getSigner, SimpleGovernor } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Interface, isAddress } from 'ethers';
import './GovernorDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '治理概览', icon: '📊' },
  { key: 'proposals', label: '提案管理', icon: '📋' },
  { key: 'parameters', label: '协议参数', icon: '⚙️' },
  { key: 'history', label: '投票历史', icon: '📜' },
];

const factoryInterface = new Interface([
  'function setFeeTo(address)',
  'function setFeeToSetter(address)',
]);

type ProposalStateLabel = 'pending' | 'active' | 'defeated' | 'succeeded' | 'queued' | 'executed' | 'expired';

interface ProposalView {
  id: number;
  proposer: string;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: number;
  againstVotes: number;
  quorum: number;
  eta: bigint;
  state: ProposalStateLabel;
  hasVoted: boolean;
  actionSummary: string;
}

function stateLabel(s: ProposalStateLabel): string {
  const map: Record<ProposalStateLabel, string> = {
    pending: '待开始',
    active: '进行中',
    defeated: '未通过',
    succeeded: '已通过',
    queued: '已排队',
    executed: '已执行',
    expired: '已过期',
  };
  return map[s] ?? s;
}

function stateFromCode(code: number): ProposalStateLabel {
  const list: ProposalStateLabel[] = ['pending', 'active', 'defeated', 'succeeded', 'queued', 'executed', 'expired'];
  return list[code] ?? 'pending';
}

function formatActionSummary(calldatas: string[]): string {
  if (!calldatas.length) return '无治理动作';
  try {
    const decoded = factoryInterface.parseTransaction({ data: calldatas[0] });
    if (!decoded) return '未知';
    return `${decoded.name}(${String(decoded.args[0])})`;
  } catch {
    return '未知';
  }
}

export function GovernorDashboard() {
  useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [walletAddress, setWalletAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [params, setParams] = useState({ votingDelay: 0n, votingPeriod: 0n, quorum: 0n, minDelay: 0n });
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDesc, setNewProposalDesc] = useState('');
  const [actionType, setActionType] = useState<'setFeeTo' | 'setFeeToSetter'>('setFeeTo');
  const [targetAddress, setTargetAddress] = useState('');

  const governorAddr = CONTRACT_ADDRESSES.DEXAMM_GOVERNOR;
  const hasGovernor = Boolean(governorAddr && governorAddr.length > 0);

  useEffect(() => {
    if (hasGovernor) void connectAndLoad();
  }, [hasGovernor]);

  const connectAndLoad = async () => {
    if (!hasGovernor) return;
    setLoading(true);
    try {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      setWalletAddress(addr);
      setConnected(true);
      await loadFromChain(addr);
    } catch (e) {
      console.error(e);
      showNotification('请连接 MetaMask', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFromChain = async (currentAddr?: string) => {
    if (!hasGovernor) return;
    try {
      const signer = await getSigner();
      const governor = new SimpleGovernor(governorAddr, signer);
      const wallet = currentAddr ?? (await signer.getAddress());

      const [count, votingDelay, votingPeriod, quorum, minDelay] = await Promise.all([
        governor.proposalCount(),
        governor.votingDelay(),
        governor.votingPeriod(),
        governor.proposalQuorum(),
        governor.minDelay(),
      ]);
      setParams({ votingDelay, votingPeriod, quorum, minDelay });

      const total = Number(count);
      const ids = Array.from({ length: Math.min(20, total) }, (_, i) => total - i).filter((n) => n >= 1);
      const list: ProposalView[] = [];
      for (const id of ids) {
        try {
          const [p, stateCode, actions, hasVoted] = await Promise.all([
            governor.getProposal(id),
            governor.state(id),
            governor.proposalActions(id),
            governor.hasVoted(id, wallet),
          ]);
          list.push({
            id,
            proposer: p.proposer,
            startBlock: p.startBlock,
            endBlock: p.endBlock,
            forVotes: Number(p.forVotes),
            againstVotes: Number(p.againstVotes),
            quorum: Number(p.quorum),
            eta: p.eta,
            state: stateFromCode(stateCode),
            hasVoted,
            actionSummary: formatActionSummary(actions.calldatas),
          });
        } catch {
          // skip invalid id
        }
      }
      setProposals(list);
    } catch (e) {
      console.error(e);
      showNotification('读取链上提案失败', 'error');
    }
  };

  const createProposal = async () => {
    if (!hasGovernor || !connected) {
      showNotification(hasGovernor ? '请先连接 MetaMask' : '请配置 DEXAMM_GOVERNOR', 'error');
      return;
    }
    if (!newProposalTitle.trim() || !targetAddress.trim()) {
      showNotification('请填写提案标题和目标地址', 'error');
      return;
    }
    if (!isAddress(targetAddress)) {
      showNotification('目标地址格式无效', 'error');
      return;
    }
    try {
      const signer = await getSigner();
      const governor = new SimpleGovernor(governorAddr, signer);
      const calldata = factoryInterface.encodeFunctionData(actionType, [targetAddress]);
      const description = `${newProposalTitle}\n${newProposalDesc}`.trim();
      const { wait } = await governor.propose(
        [CONTRACT_ADDRESSES.DEXAMM_FACTORY],
        [0n],
        [calldata],
        description
      );
      await wait();
      showNotification('提案已创建', 'success');
      setNewProposalTitle('');
      setNewProposalDesc('');
      setTargetAddress('');
      await loadFromChain(walletAddress);
    } catch (e) {
      console.error(e);
      showNotification('创建提案失败', 'error');
    }
  };

  const vote = async (proposalId: number, support: boolean) => {
    try {
      const signer = await getSigner();
      const governor = new SimpleGovernor(governorAddr, signer);
      const { wait } = await governor.castVote(proposalId, support);
      await wait();
      showNotification(support ? '已投支持' : '已投反对', 'success');
      await loadFromChain(walletAddress);
    } catch (e) {
      console.error(e);
      showNotification('投票失败', 'error');
    }
  };

  const queueProposal = async (proposalId: number) => {
    try {
      const signer = await getSigner();
      const governor = new SimpleGovernor(governorAddr, signer);
      const { wait } = await governor.queue(proposalId);
      await wait();
      showNotification('已进入执行排队', 'success');
      await loadFromChain(walletAddress);
    } catch (e) {
      console.error(e);
      showNotification('排队失败', 'error');
    }
  };

  const executeProposal = async (proposalId: number) => {
    try {
      const signer = await getSigner();
      const governor = new SimpleGovernor(governorAddr, signer);
      const { wait } = await governor.execute(proposalId);
      await wait();
      showNotification('执行成功', 'success');
      await loadFromChain(walletAddress);
    } catch (e) {
      console.error(e);
      showNotification('执行失败', 'error');
    }
  };

  const renderOverview = () => (
    <>
      <h2 className="section-title">治理概览</h2>
      {!hasGovernor ? (
        <p className="proposal-description">请在 config/contracts.ts 中配置 DEXAMM_GOVERNOR 后使用链上治理。</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{proposals.length}</div>
              <div className="stat-label">总提案数</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-value">{proposals.filter((p) => p.state === 'active').length}</div>
              <div className="stat-label">进行中</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚖️</div>
              <div className="stat-value">{String(params.quorum)}</div>
              <div className="stat-label">法定人数</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🧾</div>
              <div className="stat-value">{connected ? '已连接' : '未连接'}</div>
              <div className="stat-label">钱包</div>
            </div>
          </div>
          <div className="parameter-card" style={{ marginTop: 16 }}>
            <div className="proposal-description">Governor: {governorAddr}</div>
            <div className="proposal-description">钱包: {walletAddress || '-'}</div>
          </div>
        </>
      )}
    </>
  );

  const renderProposals = () => (
    <>
      <h2 className="section-title">提案管理</h2>
      {!hasGovernor ? (
        <p className="proposal-description">请先配置 DEXAMM_GOVERNOR。</p>
      ) : (
        <>
          <div className="create-proposal-card">
            <h3>创建新提案</h3>
            <div className="form-group">
              <label>治理动作</label>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as 'setFeeTo' | 'setFeeToSetter')}>
                <option value="setFeeTo">setFeeTo(address)</option>
                <option value="setFeeToSetter">setFeeToSetter(address)</option>
              </select>
            </div>
            <div className="form-group">
              <label>目标地址</label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>提案标题</label>
              <input
                type="text"
                value={newProposalTitle}
                onChange={(e) => setNewProposalTitle(e.target.value)}
                placeholder="简短标题"
              />
            </div>
            <div className="form-group">
              <label>提案描述</label>
              <textarea
                value={newProposalDesc}
                onChange={(e) => setNewProposalDesc(e.target.value)}
                placeholder="详细说明"
                rows={3}
              />
            </div>
            <button className="btn btn-primary" onClick={createProposal} disabled={loading}>
              {loading ? '加载中...' : '创建提案'}
            </button>
            <button className="btn btn-secondary" onClick={() => void connectAndLoad()} disabled={loading} style={{ marginLeft: 8 }}>
              刷新
            </button>
          </div>

          <div className="proposals-list">
            {proposals.map((p) => (
              <div key={p.id} className="proposal-card">
                <div className="proposal-header">
                  <h3>提案 #{p.id}</h3>
                  <span className={`proposal-status ${p.state}`}>{stateLabel(p.state)}</span>
                </div>
                <p className="proposal-description">{p.actionSummary}</p>
                <div className="proposal-info">
                  <div className="info-item">
                    <span>提案人</span>
                    <span>{p.proposer}</span>
                  </div>
                  <div className="info-item">
                    <span>区块</span>
                    <span>{String(p.startBlock)} - {String(p.endBlock)}</span>
                  </div>
                  <div className="info-item">
                    <span>ETA</span>
                    <span>{p.eta > 0n ? new Date(Number(p.eta) * 1000).toLocaleString() : '-'}</span>
                  </div>
                </div>
                <div className="proposal-votes">
                  <div className="vote-bar">
                    <div className="vote-for" style={{ width: `${((p.forVotes / (p.forVotes + p.againstVotes || 1)) * 100).toFixed(0)}%` }}>
                      <span>支持 {p.forVotes}</span>
                    </div>
                    <div className="vote-against" style={{ width: `${((p.againstVotes / (p.forVotes + p.againstVotes || 1)) * 100).toFixed(0)}%` }}>
                      <span>反对 {p.againstVotes}</span>
                    </div>
                  </div>
                  <div className="vote-actions">
                    <button className="btn btn-primary" onClick={() => vote(p.id, true)} disabled={p.state !== 'active' || p.hasVoted}>
                      支持
                    </button>
                    <button className="btn btn-danger" onClick={() => vote(p.id, false)} disabled={p.state !== 'active' || p.hasVoted}>
                      反对
                    </button>
                    <button className="btn btn-secondary" onClick={() => queueProposal(p.id)} disabled={p.state !== 'succeeded'}>
                      Queue
                    </button>
                    <button className="btn btn-success" onClick={() => executeProposal(p.id)} disabled={p.state !== 'queued'}>
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderParameters = () => (
    <>
      <h2 className="section-title">协议参数</h2>
      {!hasGovernor ? (
        <p className="proposal-description">请先配置 DEXAMM_GOVERNOR。</p>
      ) : (
        <div className="parameters-grid">
          <div className="parameter-card">
            <h3>投票延迟 (blocks)</h3>
            <div className="parameter-value">{String(params.votingDelay)}</div>
          </div>
          <div className="parameter-card">
            <h3>投票周期 (blocks)</h3>
            <div className="parameter-value">{String(params.votingPeriod)}</div>
          </div>
          <div className="parameter-card">
            <h3>法定人数</h3>
            <div className="parameter-value">{String(params.quorum)}</div>
          </div>
          <div className="parameter-card">
            <h3>执行延迟 (秒)</h3>
            <div className="parameter-value">{String(params.minDelay)}</div>
          </div>
        </div>
      )}
    </>
  );

  const renderHistory = () => (
    <>
      <h2 className="section-title">投票历史</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>提案ID</th>
              <th>动作</th>
              <th>状态</th>
              <th>我的投票</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">暂无记录</td>
              </tr>
            ) : (
              proposals.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.actionSummary}</td>
                  <td>{stateLabel(p.state)}</td>
                  <td>{p.hasVoted ? '已投票' : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <Layout
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      dashboardTitle="治理者仪表板"
    >
      <div className="content-section glass fade-in">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'proposals' && renderProposals()}
        {activeSection === 'parameters' && renderParameters()}
        {activeSection === 'history' && renderHistory()}
      </div>
      {NotificationComponent}
    </Layout>
  );
}
