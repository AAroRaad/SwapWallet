export interface MarketData {
    bestSell: string
    bestBuy: string
    latestPrice: string
    dayChange: string
}

export interface TokenMarketData {
    source: string
    destination: string
    marketData: MarketData
}

export interface AmountValue {
    number: string
    unit: string
}

export interface TokenAvailable {
    amount: AmountValue
    values: AmountValue[]
}

export interface TokenData {
    name: string
    available: TokenAvailable
    marketData: TokenMarketData[]
}

export interface WalletData {
    status: string
    result: {
        totalValue: AmountValue[]
        tokens: TokenData[]
    }
}

