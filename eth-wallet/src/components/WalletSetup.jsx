import { useState } from 'react'
import { ethers } from 'ethers'

export default function WalletSetup({ onWallet }) {
  const [tab, setTab] = useState('generate')
  const [generated, setGenerated] = useState(null)
  const [importValue, setImportValue] = useState('')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  function generateWallet() {
    const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16))
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic)
    setGenerated({ mnemonic, wallet })
    setConfirmed(false)
    setError('')
  }

  function handleImport() {
    setError('')
    const val = importValue.trim()
    if (!val) { setError('Enter a seed phrase or private key.'); return }
    try {
      let wallet
      const words = val.split(/\s+/)
      if (words.length >= 12) {
        wallet = ethers.HDNodeWallet.fromPhrase(val)
      } else {
        wallet = new ethers.Wallet(val)
      }
      onWallet(wallet)
    } catch {
      setError('Invalid seed phrase or private key.')
    }
  }

  return (
    <div>
      <div className="card">
        <div className="tabs">
          <button className={`tab ${tab === 'generate' ? 'active' : ''}`} onClick={() => { setTab('generate'); setGenerated(null); setError('') }}>
            Generate New
          </button>
          <button className={`tab ${tab === 'import' ? 'active' : ''}`} onClick={() => { setTab('import'); setGenerated(null); setError('') }}>
            Import Existing
          </button>
        </div>

        {tab === 'generate' && (
          <>
            {!generated ? (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.6 }}>
                  Create a fresh HD wallet with a 12-word BIP-39 seed phrase. The private key never leaves your browser.
                </p>
                <button className="btn btn-primary btn-full" onClick={generateWallet}>
                  Generate Wallet
                </button>
              </>
            ) : (
              <>
                <div className="alert alert-warning">
                  ⚠ Write down your seed phrase and store it somewhere safe. Anyone with these words controls your wallet. It will not be shown again.
                </div>
                <p className="card-title">Your 12-Word Seed Phrase</p>
                <div className="seed-grid">
                  {generated.mnemonic.split(' ').map((word, i) => (
                    <div className="seed-word" key={i}>
                      <span className="seed-index">{i + 1}.</span>
                      <span className="seed-word-text">{word}</span>
                    </div>
                  ))}
                </div>
                <div className="field" style={{ marginTop: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto', marginRight: 0 }}
                      checked={confirmed}
                      onChange={e => setConfirmed(e.target.checked)}
                    />
                    I have saved my seed phrase securely.
                  </label>
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setGenerated(null)}>Back</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={!confirmed}
                    onClick={() => onWallet(generated.wallet)}
                  >
                    Open Wallet
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'import' && (
          <>
            <div className="field">
              <label>Seed Phrase or Private Key</label>
              <textarea
                placeholder="Enter 12-word mnemonic phrase or 0x... private key"
                value={importValue}
                onChange={e => { setImportValue(e.target.value); setError('') }}
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button className="btn btn-primary btn-full" onClick={handleImport}>
              Import Wallet
            </button>
          </>
        )}
      </div>
    </div>
  )
}
