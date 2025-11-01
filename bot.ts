import axios from 'axios';
import dotenv from 'dotenv';
import bs58 from 'bs58';


dotenv.config();

interface TradeRequest {
  publicKey: string;
  action: string;
  mint: string;
  denominatedInSol: 'true' | 'false';
  amount: number;
  slippage: number;
  priorityFee: number;
  pool: 'pump' | 'raydium';
}

interface TriangleArbitragePath {
  tokenA: string;
  tokenB: string;
  tokenC: string;
  path: string[];
  expectedProfit: number;
}

interface TriangleArbitrageOpportunity {
  path: TriangleArbitragePath;
  profitPercentage: number;
  estimatedProfit: number;
  isProfitable: boolean;
}

const jito_engine = "https://singapore.mainnet.block-engine.jito.wtf";


const generateTriangleArbitragePaths = (): TriangleArbitragePath[] => {
    const paths: TriangleArbitragePath[] = [];
    
    // Create triangle arbitrage paths using token list
    tradingTokenList.forEach(token => {
        if (token !== BASE_TOKEN && token !== STABLE_TOKEN) {
            paths.push({
                tokenA: BASE_TOKEN, // SOL
                tokenB: token,      // Target token
                tokenC: STABLE_TOKEN, // USDC (intermediate)
                path: [BASE_TOKEN, token, STABLE_TOKEN, BASE_TOKEN],
                expectedProfit: 0
            });
        }
    });
    
    return paths;
};


const calculateTriangleArbitrageOpportunity = async (path: TriangleArbitragePath): Promise<TriangleArbitrageOpportunity> => {
    try {
        // Step 1: SOL -> TokenA
        const step1Swap = await swapData(path.tokenA, path.tokenB, tradeAmount * LAMPORTS_PER_SOL);
        if (!step1Swap.success) {
            return {
                path,
                profitPercentage: 0,
                estimatedProfit: 0,
                isProfitable: false
            };
        }
        
        // Step 2: TokenA -> SOL 
        const step2Swap = await swapData(path.tokenB, path.tokenA, parseInt(step1Swap.data.outputAmount));
        
        const outputAmount = parseInt(step2Swap.data.outputAmount);
        const inputAmount = tradeAmount * LAMPORTS_PER_SOL;
        const profit = outputAmount - inputAmount;
        const profitPercentage = (profit / inputAmount) * 100;
        
        return {
            path,
            profitPercentage,
            estimatedProfit: profit,
            isProfitable: profit > 0
        };
    } catch (error) {
        console.error(`Error calculating triangle arbitrage for path ${path.path.join(' -> ')}:`, error);
        return {
            path,
            profitPercentage: 0,
            estimatedProfit: 0,
            isProfitable: false
        };
    }
};

// Start the triangle arbitrage bot
startTriangleArbitrageBot();

