import { useState } from 'react'
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

export default function TokenManager({ signer, address }) {
  const [tokens, setTokens] = useState([])
  const [contractInput, setContractInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [activeSend, setActiveSend] = useState(null)

  async function addToken() {
    setAddError('')
    if (!ethers.isAddress(contractInput)) { setAddError('Invalid contract address.'); return }
    if (tokens.find(t => t.address.toLowerCase() === contractInput.toLowerCase())) {
      setAddError('Token already added.')
      return
    }

    setAdding(true)
    try {
      const contract = new ethers.Contract(contractInput, ERC20_ABI, signer)
      const [name, symbol, decimals, raw] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(address),
      ])
      setTokens(prev => [...prev, {
        address: contractInput,
        name,
        symbol,
        decimals: Number(decimals),
        balance: ethers.formatUnits(raw, decimals),
      }])
      setContractInput('')
    } catch {
      setAddError('Could not fetch token. Check the contract address.')
    } finally {
      setAdding(false)
    }
  }

  async function refreshToken(tokenAddr) {
    const token = tokens.find(t => t.address === tokenAddr)
    if (!token) return
    try {
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
      const raw = await contract.balanceOf(address)
      const balance = ethers.formatUnits(raw, token.decimals)
      setTokens(prev => prev.map(t => t.address === tokenAddr ? { ...t, balance } : t))
    } catch {}
  }

  function removeToken(addr) {
    setTokens(prev => prev.filter(t => t.address !== addr))
    if (activeSend === addr) setActiveSend(null)
  }

  return (
    <>
      <div className="card">
        <div className="card-title">Add ERC-20 Token</div>
        <div className="field">
          <label>Contract Address</label>
          <input
            placeholder="0x... token contract address"
            value={contractInput}
            onChange={e => { setContractInput(e.target.value); setAddError('') }}
            onKeyDown={e => e.key === 'Enter' && addToken()}
          />
        </div>
        {addError && <div className="alert alert-danger">{addError}</div>}
        <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.8rem' }}>
          Tip: Chainlink LINK on Sepolia —{' '}
          <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
            0x779877A7B0D9E8603169DdbD7836e478b4624789
          </code>
        </div>
        <button className="btn btn-primary btn-full" onClick={addToken} disabled={adding}>
          {adding ? <><span className="spinner" /> Loading…</> : 'Add Token'}
        </button>
      </div>

      {tokens.length > 0 && (
        <div className="card">
          <div className="card-title">Your Tokens</div>
          <div className="token-list">
            {tokens.map(token => (
              <div key={token.address}>
                <div className="token-item">
                  <div className="token-info">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                    <span className="token-name" style={{ fontSize: '0.7rem' }}>
                      {token.address.slice(0, 10)}…{token.address.slice(-6)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="token-balance">
                      {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.symbol}
                    </div>
                    <div className="token-actions">
                      <button className="copy-btn" title="Refresh" onClick={() => refreshToken(token.address)}>↻</button>
                      <button
                        className="copy-btn"
                        style={{ color: 'var(--accent)' }}
                        onClick={() => setActiveSend(activeSend === token.address ? null : token.address)}
                      >
                        {activeSend === token.address ? 'Cancel' : 'Send'}
                      </button>
                      <button className="copy-btn" style={{ color: 'var(--danger)' }} onClick={() => removeToken(token.address)}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {activeSend === token.address && (
                  <TokenSendForm
                    token={token}
                    signer={signer}
                    onSent={() => {
                      setActiveSend(null)
                      refreshToken(token.address)
                    }}
                    onClose={() => setActiveSend(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function TokenSendForm({ token, signer, onSent, onClose }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState(null)

  async function send() {
    setError('')
    if (!ethers.isAddress(to)) { setError('Invalid recipient address.'); return }
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount.'); return }
    if (parsed > parseFloat(token.balance)) { setError('Insufficient token balance.'); return }

    setSending(true)
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer)
      const tx = await contract.transfer(to, ethers.parseUnits(amount, token.decimals))
      setTxHash(tx.hash)
      await tx.wait()
      onSent(tx.hash)
    } catch (e) {
      setError(e.reason || e.message || 'Transaction failed.')
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      marginTop: 8,
    }}>
      <div className="field">
        <label>Recipient Address</label>
        <input placeholder="0x..." value={to} onChange={e => { setTo(e.target.value); setError('') }} />
      </div>
      <div className="field">
        <label>Amount ({token.symbol})</label>
        <input
          type="number"
          step="any"
          min="0"
          placeholder="0.0"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }}
        />
        <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Balance: {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
          <button
            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem' }}
            onClick={() => setAmount(token.balance)}
          >
            Max
          </button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {txHash && (
        <div className="alert alert-success">
          Sent!{' '}
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="tx-link">
            View on Etherscan ↗
          </a>
        </div>
      )}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={send} disabled={sending}>
          {sending ? <><span className="spinner" /> Sending…</> : `Send ${token.symbol}`}
        </button>
      </div>
    </div>
  )
}
