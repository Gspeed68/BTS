import { useState } from 'react'
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

// Known stablecoin deployments on Sepolia
const STABLECOINS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    color: '#2775CA',
    bg: 'rgba(39,117,202,0.12)',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    color: '#26A17B',
    bg: 'rgba(38,161,123,0.12)',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
    color: '#F5AC37',
    bg: 'rgba(245,172,55,0.12)',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    color: '#2A5ADA',
    bg: 'rgba(42,90,218,0.12)',
  },
]

export default function TokenManager({ signer, address }) {
  const [tokens, setTokens] = useState([])
  const [contractInput, setContractInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addingPreset, setAddingPreset] = useState(null)
  const [addError, setAddError] = useState('')
  const [activeSend, setActiveSend] = useState(null)

  async function loadToken(contractAddress) {
    if (tokens.find(t => t.address.toLowerCase() === contractAddress.toLowerCase())) return
    try {
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer)
      const [name, symbol, decimals, raw] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(address),
      ])
      setTokens(prev => [...prev, {
        address: contractAddress,
        name,
        symbol,
        decimals: Number(decimals),
        balance: ethers.formatUnits(raw, decimals),
      }])
    } catch {
      throw new Error('Could not fetch token.')
    }
  }

  async function addPreset(sc) {
    setAddingPreset(sc.address)
    setAddError('')
    try {
      await loadToken(sc.address)
    } catch {
      setAddError(`Could not load ${sc.symbol} — contract may not be active on this network.`)
    } finally {
      setAddingPreset(null)
    }
  }

  async function addCustomToken() {
    setAddError('')
    if (!ethers.isAddress(contractInput)) { setAddError('Invalid contract address.'); return }
    if (tokens.find(t => t.address.toLowerCase() === contractInput.toLowerCase())) {
      setAddError('Token already added.')
      return
    }
    setAdding(true)
    try {
      await loadToken(contractInput)
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
      setTokens(prev => prev.map(t =>
        t.address === tokenAddr ? { ...t, balance: ethers.formatUnits(raw, t.decimals) } : t
      ))
    } catch {}
  }

  function removeToken(addr) {
    setTokens(prev => prev.filter(t => t.address !== addr))
    if (activeSend === addr) setActiveSend(null)
  }

  const addedAddresses = new Set(tokens.map(t => t.address.toLowerCase()))

  return (
    <>
      {/* Stablecoin Quick-Add */}
      <div className="card">
        <div className="card-title">Stablecoins</div>
        <div className="stablecoin-grid">
          {STABLECOINS.map(sc => {
            const isAdded = addedAddresses.has(sc.address.toLowerCase())
            const isLoading = addingPreset === sc.address
            return (
              <button
                key={sc.address}
                className={`stablecoin-chip ${isAdded ? 'added' : ''}`}
                onClick={() => !isAdded && addPreset(sc)}
                disabled={isAdded || isLoading}
                title={sc.address}
              >
                <div className="sc-icon" style={{ background: sc.bg, color: sc.color }}>
                  {isLoading ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: sc.color, borderColor: `${sc.color}44` }} /> : sc.symbol.slice(0, 2)}
                </div>
                <div className="sc-info">
                  <span className="sc-symbol" style={{ color: isAdded ? 'var(--success)' : 'var(--text)' }}>
                    {isAdded ? '✓ ' : ''}{sc.symbol}
                  </span>
                  <span className="sc-name">{sc.name}</span>
                </div>
              </button>
            )
          })}
        </div>

        <hr className="divider" />

        {/* Custom token */}
        <div className="card-title">Add Any ERC-20</div>
        <div className="field">
          <label>Contract Address</label>
          <input
            placeholder="0x..."
            value={contractInput}
            onChange={e => { setContractInput(e.target.value); setAddError('') }}
            onKeyDown={e => e.key === 'Enter' && addCustomToken()}
          />
        </div>
        {addError && <div className="alert alert-danger">{addError}</div>}
        <button className="btn btn-primary btn-full" onClick={addCustomToken} disabled={adding}>
          {adding ? <><span className="spinner" /> Loading…</> : 'Add Token'}
        </button>
      </div>

      {/* Token List */}
      {tokens.length > 0 && (
        <div className="card">
          <div className="card-title">Your Tokens ({tokens.length})</div>
          <div className="token-list">
            {tokens.map(token => {
              const preset = STABLECOINS.find(s => s.address.toLowerCase() === token.address.toLowerCase())
              return (
                <div key={token.address}>
                  <div className="token-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {preset && (
                        <div className="sc-icon" style={{ background: preset.bg, color: preset.color }}>
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div className="token-info">
                        <span className="token-symbol">{token.symbol}</span>
                        <span className="token-name">{token.name}</span>
                        <span className="token-name" style={{ fontSize: '0.68rem' }}>
                          {token.address.slice(0, 10)}…{token.address.slice(-6)}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="token-balance">
                        {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        <span style={{ color: 'var(--accent)', marginLeft: 4, fontSize: '0.8rem' }}>{token.symbol}</span>
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
                      onSent={() => { setActiveSend(null); refreshToken(token.address) }}
                      onClose={() => setActiveSend(null)}
                    />
                  )}
                </div>
              )
            })}
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
            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
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
