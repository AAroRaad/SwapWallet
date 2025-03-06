"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { TokenData } from "../types"
import { ChevronDown } from "lucide-react"
import "./TokenSelector.css"

interface TokenSelectorProps {
    selectedToken: TokenData
    tokens: TokenData[]
    onSelectToken: (token: TokenData) => void
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, tokens, onSelectToken }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("")
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleTokenSelect = (token: TokenData) => {
        onSelectToken(token);
        setIsOpen(false);
    }

    const filteredTokens = tokens.filter((token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="token-selector" ref={dropdownRef}>
            <button className="token-selector-button" onClick={() => setIsOpen(!isOpen)}>
                <div className="token-icon">{selectedToken.name.charAt(0)}</div>
                <span className="token-name">{selectedToken.name}</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="token-dropdown">
                    <div className="token-search-container">
                        <input
                            type="text"
                            placeholder="Search tokens"
                            className="token-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="token-list">
                        {filteredTokens.length > 0 ? (
                            filteredTokens.map((token) => (
                                <div
                                    key={token.name}
                                    className={`token-item ${token.name === selectedToken.name ? "selected" : ""}`}
                                    onClick={() => handleTokenSelect(token)}
                                >
                                    <div className="token-item-icon">{token.name.charAt(0)}</div>
                                    <div className="token-item-details">
                                        <span className="token-item-name">{token.name}</span>
                                        <span className="token-item-balance">
                                            Balance: {Number.parseFloat(token.available.amount.number)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">No tokens found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default TokenSelector

