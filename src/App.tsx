import type React from "react"
import SwapInterface from "./components/SwapInterface"
import "./App.css"

const App: React.FC = () => {
    return (
        <div className="app">
            <header className="header">
                <h1>SwapWallet</h1>
            </header>
            <main className="main">
                <SwapInterface />
            </main>
            <footer className="footer">
                <p>© 2025 SwapWallet. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default App

