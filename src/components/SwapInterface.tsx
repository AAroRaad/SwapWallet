"use client"

import React, {useRef} from "react"
import { useState, useEffect } from "react"
import TokenSelector from "./TokenSelector"
import type { TokenData } from "../types"
import { walletData } from "../data/walletData"
import { ArrowDownUp } from "lucide-react"
import "./SwapInterface.css"

const fakeFetchTokens = (): Promise<TokenData[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(walletData.result.tokens);
        }, 1000);
    });
};

const SwapInterface: React.FC = () => {
    const [tokens, setTokens] = useState<TokenData[]>([]);
    const [sourceToken, setSourceToken] = useState<TokenData | null>(null);
    const [destinationToken, setDestinationToken] = useState<TokenData | null>(null);
    const [sourceAmount, setSourceAmount] = useState<string>("");
    const [destinationAmount, setDestinationAmount] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const hasInitialized = useRef(false);
    const shouldRecalculate = useRef(false);

    useEffect(() => {
        const fetchTokens = async () => {
            setIsLoadingData(true);
            try {
                const fetchedTokens = await fakeFetchTokens();
                setTokens(fetchedTokens);

                if (!hasInitialized.current) {
                    hasInitialized.current = true;

                    const savedSourceToken = localStorage.getItem("sourceToken");
                    const savedDestinationToken = localStorage.getItem("destinationToken");
                    const savedSourceAmount = localStorage.getItem("sourceAmount");
                    const savedDestinationAmount = localStorage.getItem("destinationAmount");

                    if (savedSourceToken) {
                        const parsedSourceToken = JSON.parse(savedSourceToken);
                        const matchedSourceToken = fetchedTokens.find(t => t.name === parsedSourceToken.name);
                        if (matchedSourceToken) {
                            setSourceToken(matchedSourceToken);
                        } else {
                            setSourceToken(fetchedTokens[0]);
                        }
                    } else {
                        setSourceToken(fetchedTokens[0]);
                    }

                    if (savedDestinationToken) {
                        const parsedDestToken = JSON.parse(savedDestinationToken);
                        const matchedDestToken = fetchedTokens.find(t => t.name === parsedDestToken.name);
                        if (matchedDestToken) {
                            setDestinationToken(matchedDestToken);
                        } else {
                            setDestinationToken(fetchedTokens[1]);
                        }
                    } else {
                        setDestinationToken(fetchedTokens[1]);
                    }

                    if (savedSourceAmount) setSourceAmount(savedSourceAmount);
                    if (savedDestinationAmount) setDestinationAmount(savedDestinationAmount);
                }
            } catch (err) {
                console.error("Failed to fetch tokens:", err);
                setError("Failed to load tokens.");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchTokens();
    }, []);

    useEffect(() => {
        if (sourceToken && destinationToken) {
            localStorage.setItem("sourceToken", JSON.stringify(sourceToken));
            localStorage.setItem("destinationToken", JSON.stringify(destinationToken));
            localStorage.setItem("sourceAmount", sourceAmount);
            localStorage.setItem("destinationAmount", destinationAmount);
        }
    }, [sourceToken, destinationToken, sourceAmount, destinationAmount]);

    useEffect(() => {
        if (!sourceToken || !sourceAmount) {
            setError("");
            return;
        }

        const numValue = Number.parseFloat(sourceAmount);
        if (isNaN(numValue) || numValue <= 0) {
            setError("");
            return;
        }

        const availableAmount = Number.parseFloat(sourceToken.available.amount.number);
        if (numValue > availableAmount) {
            setError(`Insufficient balance. You have ${availableAmount} ${sourceToken.name} available.`);
        } else {
            setError("");
        }
    }, [sourceToken, sourceAmount]);

    useEffect(() => {
        if (shouldRecalculate.current && sourceToken && destinationToken) {
            shouldRecalculate.current = false;
            if (sourceAmount) {
                handleSourceAmountChange(sourceAmount);
            } else if (destinationAmount) {
                handleDestinationAmountChange(destinationAmount);
            }
        }
    }, [sourceToken, destinationToken]);

    const getExchangeRate = async (source: string, destination: string): Promise<number> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const marketData = tokens
                    .find((token) => token.name === source)
                    ?.marketData.find((data) => data.destination === destination)

                if (marketData) {
                    resolve(Number.parseFloat(marketData.marketData.bestSell))
                } else {
                    const sourceToUsdt = tokens
                        .find((token) => token.name === source)
                        ?.marketData.find((data) => data.destination === "USDT")

                    const usdtToDestination = tokens
                        .find((token) => token.name === "USDT")
                        ?.marketData.find((data) => data.destination === destination)

                    if (sourceToUsdt && usdtToDestination) {
                        resolve(
                            Number.parseFloat(sourceToUsdt.marketData.bestSell) *
                            Number.parseFloat(usdtToDestination.marketData.bestSell),
                        )
                    } else {
                        resolve(Math.random() * 100)
                    }
                }
            }, 300)
        })
    }

    const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSourceAmountChange = async (value: string) => {
        setSourceAmount(value);
        setIsLoading(true);

        if (timeoutId.current) clearTimeout(timeoutId.current);

        timeoutId.current = setTimeout(async () => {
            if (value === "" || !sourceToken || !destinationToken) {
                setDestinationAmount("");
                setIsLoading(false);
                return;
            }

            try {
                const rate = await getExchangeRate(sourceToken.name, destinationToken.name);
                const numValue = Number.parseFloat(value);
                if (!isNaN(numValue)) {
                    setDestinationAmount((numValue * rate).toFixed(2));
                }
            } catch (err) {
                console.error("Error calculating exchange rate:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleDestinationAmountChange = async (value: string) => {
        setDestinationAmount(value);
        setIsLoading(true);

        if (timeoutId.current) clearTimeout(timeoutId.current);

        timeoutId.current = setTimeout(async () => {
            if (value === "" || !sourceToken || !destinationToken) {
                setSourceAmount("");
                setIsLoading(false);
                return;
            }

            try {
                const rate = await getExchangeRate(destinationToken.name, sourceToken.name);
                const numValue = Number.parseFloat(value);
                if (!isNaN(numValue)) {
                    setSourceAmount((numValue * rate).toFixed(6));
                }
            } catch (err) {
                console.error("Error calculating exchange rate:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleSwapTokens = () => {
        const tempToken = sourceToken;
        setSourceToken(destinationToken);
        setDestinationToken(tempToken);

        setSourceAmount("");
        setDestinationAmount("");
    }

    const handleSourceTokenChange = (token: TokenData) => {
        if (token.name === sourceToken?.name) {
            return;
        }

        if (token.name === destinationToken?.name) {
            setDestinationToken(sourceToken);
        }

        setSourceToken(token);
        shouldRecalculate.current = true;
    }

    const handleDestinationTokenChange = (token: TokenData) => {
        if (token.name === destinationToken?.name) {
            return;
        }

        if (token.name === sourceToken?.name) {
            setSourceToken(destinationToken);
        }

        setDestinationToken(token);
        shouldRecalculate.current = true;
    }

    if (isLoadingData) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading...</div>
            </div>
        );
    }

    if (!tokens.length || !sourceToken || !destinationToken) {
        return null;
    }

    return (
        <div className="swap-container">
            <h2 className="swap-title">Swap Tokens</h2>

            <div className="swap-form">
                <div className="swap-input-container">
                    <div className="swap-input-header">
                        <span>From</span>
                        <span className="balance">
                         Balance: {Number.parseFloat(sourceToken.available.amount.number)} {sourceToken.name}
                        </span>
                    </div>
                    <div className="swap-input-wrapper">
                        <input
                            type="number"
                            value={sourceAmount}
                            onChange={(e) => handleSourceAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="swap-input"
                        />
                        <TokenSelector selectedToken={sourceToken} tokens={tokens} onSelectToken={handleSourceTokenChange} />
                    </div>
                </div>

                <button className="swap-button" onClick={handleSwapTokens}>
                    <ArrowDownUp size={20} />
                </button>

                <div className="swap-input-container">
                    <div className="swap-input-header">
                        <span>To</span>
                        <span className="balance">
                         Balance: {Number.parseFloat(destinationToken.available.amount.number)} {destinationToken.name}
                        </span>
                    </div>
                    <div className="swap-input-wrapper">
                        <input
                            type="number"
                            value={destinationAmount}
                            onChange={(e) => handleDestinationAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="swap-input"
                        />
                        <TokenSelector
                            selectedToken={destinationToken}
                            tokens={tokens}
                            onSelectToken={handleDestinationTokenChange}
                        />
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {isLoading && <div className="loading-message">Calculating exchange rate...</div>}

                <button className="swap-submit-button" disabled={!sourceAmount || !destinationAmount || !!error || isLoading}>
                    Swap
                </button>
            </div>
        </div>
    )
}

export default SwapInterface