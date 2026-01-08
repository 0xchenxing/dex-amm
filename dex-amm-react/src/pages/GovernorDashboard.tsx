import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { governanceStorage } from '../services/storage';
import type { GovernanceProposal } from '../types';
import './GovernorDashboard.css';

const navItems: Array<{ path: string; label: string; icon: string }> = [];

export function GovernorDashboard() {
  const { user } = useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDesc, setNewProposalDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allProposals = governanceStorage.getAll();
    setProposals(allProposals);
  };

  const createProposal = () => {
    if (!newProposalTitle || !newProposalDesc) {
      showNotification('请填写完整的提案信息', 'error');
      return;
    }

    const newProposal: GovernanceProposal = {
      id: `proposal-${Date.now()}`,
      title: newProposalTitle,
      description: newProposalDesc,
      proposer: user?.username || '',
      status: 'pending',
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quorum: 10000
    };

    governanceStorage.save(newProposal);
    showNotification('提案创建成功', 'success');
    setNewProposalTitle('');
    setNewProposalDesc('');
    loadData();
  };

  const vote = (proposalId: string, voteType: 'for' | 'against') => {
    const proposal = governanceStorage.getById(proposalId);
    if (proposal) {
      if (voteType === 'for') {
        proposal.votesFor++;
      } else {
        proposal.votesAgainst++;
      }
      proposal.totalVotes++;
      governanceStorage.save(proposal);
      showNotification(`投票${voteType === 'for' ? '支持' : '反对'}成功`, 'success');
      loadData();
    }
  };

  const renderOverview = () => (
    <>
      <h2 className="section-title">治理概览</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{proposals.length}</div>
          <div className="stat-label">总提案数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{proposals.filter(p => p.status === 'active').length}</div>
          <div className="stat-label">进行中提案</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">10,000</div>
          <div className="stat-label">投票权重</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">85%</div>
          <div className="stat-label">参与度</div>
        </div>
      </div>
    </>
  );

  const renderProposals = () => (
    <>
      <h2 className="section-title">提案管理</h2>
      
      <div className="create-proposal-card">
        <h3>创建新提案</h3>
        <div className="form-group">
          <label>提案标题</label>
          <input
            type="text"
            value={newProposalTitle}
            onChange={(e) => setNewProposalTitle(e.target.value)}
            placeholder="输入提案标题"
          />
        </div>
        <div className="form-group">
          <label>提案描述</label>
          <textarea
            value={newProposalDesc}
            onChange={(e) => setNewProposalDesc(e.target.value)}
            placeholder="输入提案详细描述"
            rows={4}
          />
        </div>
        <button className="btn btn-primary" onClick={createProposal}>
          创建提案
        </button>
      </div>

      <div className="proposals-list">
        {proposals.map(proposal => (
          <div key={proposal.id} className="proposal-card">
            <div className="proposal-header">
              <h3>{proposal.title}</h3>
              <span className={`proposal-status ${proposal.status}`}>
                {proposal.status === 'active' ? '进行中' : 
                 proposal.status === 'pending' ? '待开始' :
                 proposal.status === 'passed' ? '已通过' : '已拒绝'}
              </span>
            </div>
            <p className="proposal-description">{proposal.description}</p>
            <div className="proposal-info">
              <div className="info-item">
                <span>提案人:</span>
                <span>{proposal.proposer}</span>
              </div>
              <div className="info-item">
                <span>开始时间:</span>
                <span>{new Date(proposal.startTime).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span>结束时间:</span>
                <span>{new Date(proposal.endTime).toLocaleString()}</span>
              </div>
            </div>
            <div className="proposal-votes">
              <div className="vote-bar">
                <div className="vote-for" style={{ width: `${(proposal.votesFor / (proposal.totalVotes || 1)) * 100}%` }}>
                  <span>支持: {proposal.votesFor}</span>
                </div>
                <div className="vote-against" style={{ width: `${(proposal.votesAgainst / (proposal.totalVotes || 1)) * 100}%` }}>
                  <span>反对: {proposal.votesAgainst}</span>
                </div>
              </div>
              <div className="vote-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => vote(proposal.id, 'for')}
                  disabled={proposal.status !== 'active'}
                >
                  投票支持
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => vote(proposal.id, 'against')}
                  disabled={proposal.status !== 'active'}
                >
                  投票反对
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderParameters = () => (
    <>
      <h2 className="section-title">协议参数</h2>
      <div className="parameters-grid">
        <div className="parameter-card">
          <h3>交易手续费率</h3>
          <div className="parameter-value">0.3%</div>
          <button className="btn btn-primary">调整</button>
        </div>
        <div className="parameter-card">
          <h3>流动性要求</h3>
          <div className="parameter-value">$10,000</div>
          <button className="btn btn-primary">调整</button>
        </div>
        <div className="parameter-card">
          <h3>奖励机制</h3>
          <div className="parameter-value">15% APY</div>
          <button className="btn btn-primary">调整</button>
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <h2 className="section-title">投票历史</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>提案</th>
              <th>投票</th>
              <th>权重</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                暂无投票记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <Layout navItems={navItems}>
      <div className="header">
        <h1 className="header-title">治理者仪表板</h1>
      </div>

      <div className="section-tabs">
        <button
          className={`tab-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          治理概览
        </button>
        <button
          className={`tab-btn ${activeSection === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveSection('proposals')}
        >
          提案管理
        </button>
        <button
          className={`tab-btn ${activeSection === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveSection('parameters')}
        >
          协议参数
        </button>
        <button
          className={`tab-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          投票历史
        </button>
      </div>

      <div className="content-section">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'proposals' && renderProposals()}
        {activeSection === 'parameters' && renderParameters()}
        {activeSection === 'history' && renderHistory()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

