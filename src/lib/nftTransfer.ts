import { Match, Player, NFT, WithdrawNftInput, WithdrawNftResponse, NFTTransferOperation, FlowAccount } from '@/types';
import { WITHDRAW_NFT_MUTATION, GET_MY_FLOW_ACCOUNT, GET_FLOW_ACCOUNT } from './graphql/queries';

// Types for the transfer context
interface TransferContext {
  accessToken: string;
  graphqlEndpoint: string;
}

interface PlayerWithFlowAddress extends Player {
  flowAddress: string;
}

// GraphQL client for making authenticated requests
class GraphQLClient {
  private endpoint: string;
  private accessToken: string;

  constructor(endpoint: string, accessToken: string) {
    this.endpoint = endpoint;
    this.accessToken = accessToken;
  }

  async query<T = Record<string, unknown>>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.accessToken, // Dapper uses no "Bearer" prefix
        'Accept': 'application/graphql-response+json',
        'X-Request-Id': Math.random().toString(36).substring(2),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL Error: ${data.errors[0]?.message || 'Unknown error'}`);
    }

    return data.data;
  }

  async mutate<T = Record<string, unknown>>(mutation: string, variables?: Record<string, unknown>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}

// Service class for handling NFT transfers
export class NFTTransferService {
  private client: GraphQLClient;
  private maxRetries: number = 3;
  private retryDelay: number = 2000; // 2 seconds

  constructor(context: TransferContext) {
    this.client = new GraphQLClient(context.graphqlEndpoint, context.accessToken);
  }

  /**
   * Main entry point for handling post-match NFT transfers
   */
  async handleMatchFinishTransfer(match: Match): Promise<{
    success: boolean;
    operations: NFTTransferOperation[];
    error?: string;
  }> {
    try {
      console.log(`Starting NFT transfer process for match ${match.id}`);
      
      // Determine what transfers need to happen
      const transferPlan = this.createTransferPlan(match);
      
      if (transferPlan.length === 0) {
        return { success: true, operations: [] };
      }

      // Get Flow addresses for all players
      const playersWithAddresses = await this.getPlayersFlowAddresses(match);
      
      // Execute all transfers
      const operations: NFTTransferOperation[] = [];
      
      for (const plan of transferPlan) {
        const operation = await this.executeTransfer(plan, playersWithAddresses, match);
        operations.push(operation);
      }

      // Check if all transfers were successful
      const allSuccessful = operations.every(op => op.status === 'COMPLETED');
      
      return {
        success: allSuccessful,
        operations,
        error: allSuccessful ? undefined : 'Some transfers failed'
      };

    } catch (error) {
      console.error('Error in handleMatchFinishTransfer:', error);
      return {
        success: false,
        operations: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Creates a plan for what NFT transfers need to happen based on match result
   */
  private createTransferPlan(match: Match): Array<{
    fromPlayer: 'A' | 'B';
    toPlayer: 'A' | 'B';
    nft: NFT;
  }> {
    const plan: Array<{ fromPlayer: 'A' | 'B'; toPlayer: 'A' | 'B'; nft: NFT }> = [];

    if (match.status !== 'FINISHED' || !match.winner) {
      return plan;
    }

    // Handle different match outcomes
    switch (match.winner) {
      case 'A':
        // Player A wins both NFTs
        if (match.nftB && match.playerB) {
          plan.push({
            fromPlayer: 'B',
            toPlayer: 'A',
            nft: match.nftB
          });
        }
        break;
        
      case 'B':
        // Player B wins both NFTs
        if (match.nftA && match.playerA) {
          plan.push({
            fromPlayer: 'A',
            toPlayer: 'B',
            nft: match.nftA
          });
        }
        break;
        
      case 'TIE':
        // No transfers on tie - each player keeps their NFT
        console.log('Match ended in tie - no NFT transfers needed');
        break;
    }

    return plan;
  }

  /**
   * Gets Flow addresses for all players in the match
   */
  private async getPlayersFlowAddresses(match: Match): Promise<{
    playerA: PlayerWithFlowAddress;
    playerB?: PlayerWithFlowAddress;
  }> {
    const players: { playerA: PlayerWithFlowAddress; playerB?: PlayerWithFlowAddress } = {
      playerA: { ...match.playerA, flowAddress: '' }
    };

    // Get Flow address for Player A
    try {
      const flowAccountA = await this.getFlowAddressForPlayer(match.playerA);
      players.playerA.flowAddress = flowAccountA.address;
    } catch (error) {
      throw new Error(`Failed to get Flow address for Player A: ${error}`);
    }

    // Get Flow address for Player B if exists
    if (match.playerB) {
      try {
        const flowAccountB = await this.getFlowAddressForPlayer(match.playerB);
        players.playerB = { ...match.playerB, flowAddress: flowAccountB.address };
      } catch (error) {
        throw new Error(`Failed to get Flow address for Player B: ${error}`);
      }
    }

    return players;
  }

  /**
   * Gets Flow address for a specific player
   */
  private async getFlowAddressForPlayer(player: Player): Promise<FlowAccount> {
    // If player already has flow address cached, validate it
    if (player.flowAddress) {
      try {
        const account = await this.client.query<{ getFlowAccount: FlowAccount }>(
          GET_FLOW_ACCOUNT.loc?.source.body || '',
          { address: player.flowAddress }
        );
        if (account.getFlowAccount) {
          return account.getFlowAccount;
        }
      } catch (error) {
        console.warn(`Cached flow address invalid for player ${player.id}:`, error);
      }
    }

    // Get the current user's flow account (this assumes the service is called with the right auth context)
    const result = await this.client.query<{ getMyFlowAccount: FlowAccount }>(GET_MY_FLOW_ACCOUNT.loc?.source.body || '');
    
    if (!result.getMyFlowAccount) {
      throw new Error(`No Flow account found for player ${player.name}`);
    }

    return result.getMyFlowAccount;
  }

  /**
   * Executes a single NFT transfer with retry logic
   */
  private async executeTransfer(
    transferPlan: { fromPlayer: 'A' | 'B'; toPlayer: 'A' | 'B'; nft: NFT },
    players: { playerA: PlayerWithFlowAddress; playerB?: PlayerWithFlowAddress },
    match: Match
  ): Promise<NFTTransferOperation> {
    const operation: NFTTransferOperation = {
      id: `${match.id}-${transferPlan.nft.id}-${Date.now()}`,
      matchId: match.id,
      fromPlayer: transferPlan.fromPlayer,
      toPlayer: transferPlan.toPlayer,
      nftId: transferPlan.nft.id,
      nftTokenId: transferPlan.nft.serialNumber || parseInt(transferPlan.nft.id),
      fromAddress: transferPlan.fromPlayer === 'A' ? players.playerA.flowAddress : players.playerB!.flowAddress,
      toAddress: transferPlan.toPlayer === 'A' ? players.playerA.flowAddress : players.playerB!.flowAddress,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: this.maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Execute transfer with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      operation.attempts = attempt;
      operation.updatedAt = new Date().toISOString();

      try {
        console.log(`Transfer attempt ${attempt}/${this.maxRetries} for NFT ${transferPlan.nft.id}`);
        
        operation.status = 'IN_PROGRESS';
        
        const withdrawInput: WithdrawNftInput = {
          dappID: transferPlan.nft.dappID || 'nba-top-shot', // Default to NBA Top Shot
          destinationAddress: operation.toAddress,
          tokenID: operation.nftTokenId,
          contractQualifiedName: transferPlan.nft.contract || 'A.877931736ee77cff.TopShot'
        };

        const result = await this.client.mutate<{ withdrawNFT: WithdrawNftResponse }>(
          WITHDRAW_NFT_MUTATION.loc?.source.body || '',
          { input: withdrawInput }
        );

        if (result.withdrawNFT) {
          operation.withdrawalId = result.withdrawNFT.id;
          operation.status = 'COMPLETED';
          operation.transactionHash = result.withdrawNFT.withdrawal.transactionHash;
          
          console.log(`NFT transfer completed successfully: ${operation.withdrawalId}`);
          break;
        } else {
          throw new Error('No withdrawal response received');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        operation.error = errorMessage;
        
        console.error(`Transfer attempt ${attempt} failed:`, errorMessage);
        
        if (attempt === this.maxRetries) {
          operation.status = 'FAILED';
          console.error(`All transfer attempts failed for NFT ${transferPlan.nft.id}`);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    return operation;
  }

  /**
   * Validates that a transfer can be executed
   */
  private async validateTransfer(
    nft: NFT,
    fromAddress: string,
    toAddress: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Basic validation
    if (!fromAddress || !toAddress) {
      return { valid: false, error: 'Missing source or destination address' };
    }

    if (fromAddress === toAddress) {
      return { valid: false, error: 'Source and destination addresses are the same' };
    }

    if (!nft.id || (!nft.serialNumber && !parseInt(nft.id))) {
      return { valid: false, error: 'Invalid NFT token ID' };
    }

    // Additional validations could be added here:
    // - Check if NFT is not already in withdrawal
    // - Check if destination address is initialized
    // - Check ownership of NFT

    return { valid: true };
  }
}

/**
 * Factory function to create NFT transfer service with proper context
 */
export async function createNFTTransferService(): Promise<NFTTransferService> {
  // Get access token from the API
  const tokenResponse = await fetch('/api/access-token');
  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token for NFT transfer');
  }
  
  const tokenData = await tokenResponse.json();
  if (!tokenData.accessToken) {
    throw new Error('No access token available for NFT transfer');
  }

  const context: TransferContext = {
    accessToken: tokenData.accessToken,
    graphqlEndpoint: 'https://staging.accounts.meetdapper.com/graphql'
  };

  return new NFTTransferService(context);
}

/**
 * Convenience function to handle match finish and trigger transfers
 */
export async function handleMatchFinishTransfers(match: Match): Promise<{
  success: boolean;
  operations: NFTTransferOperation[];
  error?: string;
}> {
  try {
    const transferService = await createNFTTransferService();
    return await transferService.handleMatchFinishTransfer(match);
  } catch (error) {
    console.error('Error creating NFT transfer service:', error);
    return {
      success: false,
      operations: [],
      error: error instanceof Error ? error.message : 'Failed to initialize transfer service'
    };
  }
} 