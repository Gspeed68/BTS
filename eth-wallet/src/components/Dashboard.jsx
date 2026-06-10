import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import SendETH from './SendETH'
import TokenManager from './TokenManager'

const SEPOLIA_RPC = 'https://rpc.sepolia.org'
const SEPOLIA_FALLBACK = 'https://ethereum-sepolia-rpc.publicnode.com'
const EXPLORER = 'https://sepolia.etherscan.io'

function getProvider() {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC)
}

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function Dashboard({ wallet }) {
  const [section, setSection] = useState('overview')
  const [balance, setBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState(null)

  const provider = getProvider()
  const signer = wallet.connect(provider)

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true)
    try {
      const bal = await provider.getBalance(wallet.address)
      setBalance(ethers.formatEther(bal))
    } catch {
      setBalance(null)
    } finally {
      setLoadingBalance(false)
    }
  }, [wallet.address])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  function copyAddress() {
    navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function onSent(hash) {
    setTxHash(hash)
    setSection('overview')
    fetchBalance()
  }

  return (
    <>
      {/* Address Card */}
      <div className="card">
        <div className="card-title">Your Address</div>
        <div className="address-box">
          <span className="address-text">{wallet.address}</span>
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyAddress}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <a
            className="copy-btn"
            href={`${EXPLORER}/address/${wallet.address}`}
            target="_blank"
            rel="noreferrer"
          >
            ↗ Explorer
          </a>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>ETH Balance</div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchBalance} disabled={loadingBalance}>
            {loadingBalance ? <span className="spinner" /> : '↻ Refresh'}
          </button>
        </div>
        <div className="balance-display">
          {balance === null ? (
            <span style={{ color: 'var(--text-muted)' }}>—</span>
          ) : (
            <>
              <span className="balance-amount">{parseFloat(balance).toFixed(6)}</span>
              <span className="balance-symbol">ETH</span>
              <div className="balance-usd" style={{ marginTop: 8 }}>
                <a href="https://sepoliafaucet.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                  Get free testnet ETH →
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Last TX */}
      {txHash && (
        <div className="alert alert-success">
          Transaction sent!{' '}
          <a className="tx-link" href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer">
            {shortAddr(txHash)} ↗
          </a>
        </div>
      )}

      {/* Section Navigation */}
      <div className="section-tabs">
        {[['overview', 'Overview'], ['send', 'Send ETH'], ['tokens', 'Tokens']].map(([id, label]) => (
          <button
            key={id}
            className={`section-tab ${section === id ? 'active' : ''}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="card">
          <div className="card-title">Quick Actions</div>
          <div className="btn-group">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSection('send')}>
              Send ETH
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSection('tokens')}>
              Manage Tokens
            </button>
          </div>
          <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p>Network: <strong style={{ color: 'var(--text)' }}>Sepolia Testnet (Chain ID 11155111)</strong></p>
            <p style={{ marginTop: 4 }}>
              Explorer:{' '}
              <a href={`${EXPLORER}/address/${wallet.address}`} target="_blank" rel="noreferrer" className="tx-link">
                {EXPLORER}
              </a>
            </p>
          </div>
        </div>
      )}

      {section === 'send' && (
        <SendETH signer={signer} balance={balance} onSent={onSent} />
      )}

      {section === 'tokens' && (
        <TokenManager signer={signer} address={wallet.address} />
      )}
    </>
  )
}
