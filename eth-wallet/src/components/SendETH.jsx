import { useState } from 'react'
import { ethers } from 'ethers'

export default function SendETH({ signer, balance, onSent }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    setError('')
    setStatus(null)

    if (!ethers.isAddress(to)) { setError('Invalid recipient address.'); return }
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount.'); return }
    if (balance !== null && parsed > parseFloat(balance)) { setError('Insufficient balance.'); return }

    setSending(true)
    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      })
      setStatus({ hash: tx.hash, waiting: true })
      await tx.wait()
      setStatus({ hash: tx.hash, waiting: false })
      onSent(tx.hash)
      setTo('')
      setAmount('')
    } catch (e) {
      setError(e.reason || e.message || 'Transaction failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card">
      <div className="card-title">Send ETH</div>

      <div className="field">
        <label>Recipient Address</label>
        <input
          placeholder="0x..."
          value={to}
          onChange={e => { setTo(e.target.value); setError('') }}
        />
      </div>

      <div className="field">
        <label>Amount (ETH)</label>
        <input
          type="number"
          step="0.000001"
          min="0"
          placeholder="0.0"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }}
        />
        {balance !== null && (
          <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Available: {parseFloat(balance).toFixed(6)} ETH
            <button
              style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem' }}
              onClick={() => setAmount(balance)}
            >
              Max
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {status && (
        <div className="alert alert-info">
          {status.waiting ? '⏳ Waiting for confirmation...' : '✓ Confirmed! '}{' '}
          <a
            href={`https://sepolia.etherscan.io/tx/${status.hash}`}
            target="_blank"
            rel="noreferrer"
            className="tx-link"
          >
            View on Etherscan ↗
          </a>
        </div>
      )}

      <button className="btn btn-primary btn-full" onClick={send} disabled={sending}>
        {sending ? <><span className="spinner" /> Sending…</> : 'Send ETH'}
      </button>
    </div>
  )
}
