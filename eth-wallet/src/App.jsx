import { useState } from 'react'
import WalletSetup from './components/WalletSetup'
import Dashboard from './components/Dashboard'

export default function App() {
  const [wallet, setWallet] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>⬡ ETH Wallet</h1>
        <div className="header-actions">
          <span className="network-badge">SEPOLIA TESTNET</span>
          {wallet && (
            <button
              className="btn btn-danger"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => setWallet(null)}
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      {!wallet ? (
        <WalletSetup onWallet={setWallet} />
      ) : (
        <Dashboard wallet={wallet} />
      )}
    </div>
  )
}
