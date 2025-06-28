import { Match, Player, NFT, WithdrawNftResponse, NFTTransferOperation, FlowAccount } from '@/types';
import { GET_MY_FLOW_ACCOUNT, GET_FLOW_ACCOUNT } from './graphql/queries';

// Types for the transfer context
interface TransferContext {
  accessToken: string;
  graphqlEndpoint: string;
  authenticatedUserId: string; // Add user ID to know who is authenticated
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
  private authenticatedUserId: string; // Track who is authenticated

  constructor(context: TransferContext) {
    this.client = new GraphQLClient(context.graphqlEndpoint, context.accessToken);
    this.authenticatedUserId = context.authenticatedUserId;
  }

  /**
   * Main entry point for handling post-match NFT transfers
   * IMPORTANT: This now only handles transfers FROM the authenticated user
   */
  async handleMatchFinishTransfer(match: Match): Promise<{
    success: boolean;
    operations: NFTTransferOperation[];
    error?: string;
  }> {
    try {
      console.log(`Starting NFT transfer process for match ${match.id}, winner: ${match.winner}`);
      console.log(`Authenticated user: ${this.authenticatedUserId}`);
      
      // Determine what transfers need to happen
      const transferPlan = this.createTransferPlan(match);
      console.log(`Transfer plan created: ${transferPlan.length} transfers needed`);
      
      if (transferPlan.length === 0) {
        console.log('No transfers needed - returning success');
        return { success: true, operations: [] };
      }

      // CRITICAL: Filter transfers to only those FROM the authenticated user
      const authenticatedUserTransfers = transferPlan.filter(plan => {
        const fromPlayerId = plan.fromPlayer === 'A' ? match.playerA.id : match.playerB?.id;
        const canExecute = fromPlayerId === this.authenticatedUserId;
        
        if (!canExecute) {
          console.log(`Skipping transfer from ${plan.fromPlayer} - not authenticated as owner (${fromPlayerId})`);
        } else {
          console.log(`Will execute transfer from ${plan.fromPlayer} - authenticated as owner (${fromPlayerId})`);
        }
        
        return canExecute;
      });

      if (authenticatedUserTransfers.length === 0) {
        console.log('No transfers can be executed by authenticated user');
        return { 
          success: true, 
          operations: [],
          error: 'No transfers required from authenticated user'
        };
      }

      // Get Flow addresses for all players
      console.log('Getting Flow addresses for players...');
      const playersWithAddresses = await this.getPlayersFlowAddresses(match);
      console.log(`Flow addresses obtained - PlayerA: ${playersWithAddresses.playerA.flowAddress}, PlayerB: ${playersWithAddresses.playerB?.flowAddress}`);
      
      // Execute only the transfers that the authenticated user can perform
      const operations: NFTTransferOperation[] = [];
      
      for (const plan of authenticatedUserTransfers) {
        console.log(`Executing transfer: ${plan.nft.name} from ${plan.fromPlayer} to ${plan.toPlayer}`);
        const operation = await this.executeTransfer(plan, playersWithAddresses, match);
        operations.push(operation);
        console.log(`Transfer operation completed with status: ${operation.status}`);
      }

      // Check if all transfers were initiated successfully (COMPLETED or IN_PROGRESS are both success)
      const allSuccessful = operations.every(op => 
        op.status === 'COMPLETED' || op.status === 'IN_PROGRESS'
      );
      
      console.log(`All authenticated user transfers completed. Success: ${allSuccessful}`);
      console.log('Transfer statuses:', operations.map(op => `${op.nftId}: ${op.status}`));
      
      return {
        success: allSuccessful,
        operations,
        error: allSuccessful ? undefined : 'Some transfers failed to initiate'
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
    console.log('Match PlayerA stored flow address:', match.playerA.flowAddress);
    console.log('Match PlayerB stored flow address:', match.playerB?.flowAddress);
    
    // Validate that Flow addresses are available
    if (!match.playerA.flowAddress) {
      throw new Error('Player A Flow address is not available');
    }
    
    if (!match.playerB?.flowAddress) {
      throw new Error('Player B Flow address is not available');
    }

    // Validate addresses are different
    if (match.playerA.flowAddress === match.playerB.flowAddress) {
      throw new Error('Players cannot have the same Flow address');
    }

    const players: { playerA: PlayerWithFlowAddress; playerB?: PlayerWithFlowAddress } = {
      playerA: { ...match.playerA, flowAddress: match.playerA.flowAddress },
      playerB: match.playerB ? { ...match.playerB, flowAddress: match.playerB.flowAddress } : undefined
    };

    console.log('Using stored Flow addresses - PlayerA:', players.playerA.flowAddress, 'PlayerB:', players.playerB?.flowAddress);

    return players;
  }

  /**
   * Gets Flow address for a specific player
   */
  private async getFlowAddressForPlayer(player: Player): Promise<FlowAccount> {
    // If player already has flow address cached, validate it
    if (player.flowAddress) {
      try {
        const account = await this.client.query<{ getFlowAccount: string }>(
          GET_FLOW_ACCOUNT.loc?.source.body || '',
          { address: player.flowAddress }
        );
        if (account.getFlowAccount) {
          return {
            address: account.getFlowAccount,
            balance: 0,
            isInitialized: true
          };
        }
      } catch (error) {
        console.warn(`Cached flow address invalid for player ${player.id}:`, error);
      }
    }

    // Get the current user's flow account (this assumes the service is called with the right auth context)
    try {
      const result = await this.client.query<{ getMyFlowAccount: string }>(GET_MY_FLOW_ACCOUNT.loc?.source.body || '');
      
      if (!result.getMyFlowAccount) {
        throw new Error(`No Flow account found for player ${player.name}`);
      }

      return {
        address: result.getMyFlowAccount,
        balance: 0,
        isInitialized: true
      };
    } catch (error) {
      // For server-side operations, we might not have proper auth context
      // In this case, we'll create a mock Flow account for testing
      console.warn(`Could not get Flow account for player ${player.name}, using mock address:`, error);
      
      // Return a mock Flow account for development/testing
      // In production, this should be replaced with proper multi-user Flow address resolution
      return {
        address: `0x${player.id.replace(/-/g, '').substring(0, 16)}`, // Generate a mock address from player ID
        balance: 0,
        isInitialized: true
      };
    }
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
      nftTokenId: parseInt(transferPlan.nft.id) || 0, // Use the NFT ID as the token ID
      fromAddress: transferPlan.fromPlayer === 'A' ? players.playerA.flowAddress : players.playerB!.flowAddress,
      toAddress: transferPlan.toPlayer === 'A' ? players.playerA.flowAddress : players.playerB!.flowAddress,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: this.maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate the operation before attempting transfer
    if (operation.nftTokenId === 0 || isNaN(operation.nftTokenId)) {
      operation.status = 'FAILED';
      operation.error = `Invalid token ID: ${operation.nftTokenId}. NFT ID: ${transferPlan.nft.id} (should be numeric), Serial: ${transferPlan.nft.serialNumber}`;
      console.error(operation.error);
      return operation;
    }

    if (!transferPlan.nft.dappID) {
      console.warn(`Missing dappID for NFT ${transferPlan.nft.id}, using fallback NBA Top Shot dappID`);
      console.error('Full NFT data:', JSON.stringify(transferPlan.nft, null, 2));
      
      // Use fallback dappID for NBA Top Shot
      transferPlan.nft.dappID = 'ad3260ba-a87c-4359-a8b0-def2cc36310b';
      console.log('Applied fallback dappID:', transferPlan.nft.dappID);
    }

    console.log(`Starting transfer for NFT ${transferPlan.nft.id} (Token ID: ${operation.nftTokenId}) from ${operation.fromAddress} to ${operation.toAddress}`);

    // Execute transfer with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      operation.attempts = attempt;
      operation.updatedAt = new Date().toISOString();

      try {
        console.log(`Transfer attempt ${attempt}/${this.maxRetries} for NFT ${transferPlan.nft.id} (Token ID: ${operation.nftTokenId})`);
        
        operation.status = 'IN_PROGRESS';
        
        const withdrawInput = {
          tokenID: operation.nftTokenId.toString(),
          destinationAddress: operation.toAddress.startsWith('0x') ? operation.toAddress : `0x${operation.toAddress}`,
          dappID: transferPlan.nft.dappID!,
          contractQualifiedName: "A.877931736ee77cff.TopShot"
        };

        console.log('Withdraw input:', JSON.stringify(withdrawInput, null, 2));

        // Use the working GraphQL mutation from our test
        const result = await this.client.mutate<{ withdrawNFT: WithdrawNftResponse }>(`
          mutation WithdrawNFT($input: WithdrawNFTInput!) {
            withdrawNFT(input: $input) {
              id
              withdrawal {
                id
                state
                contractQualifiedName
                destinationAddress
                sourceAddress
                tokenID
                txnHash
                createdAt
                dappID
              }
            }
          }
        `, { input: withdrawInput });

        if (result?.withdrawNFT) {
          operation.withdrawalId = result.withdrawNFT.id;
          const withdrawalState = String(result.withdrawNFT.withdrawal.state);
          
          // Update status based on withdrawal state
          if (['REQUESTED', 'PROCESSING', 'PENDING'].includes(withdrawalState)) {
            operation.status = 'IN_PROGRESS';
          } else if (withdrawalState === 'COMPLETED') {
            operation.status = 'COMPLETED';
          } else if (withdrawalState === 'FAILED') {
            operation.status = 'FAILED';
            operation.error = 'Withdrawal failed on Dapper side';
          }
          
          // Try to get transaction hash from the response
          const withdrawal = result.withdrawNFT.withdrawal as unknown as Record<string, unknown>;
          operation.transactionHash = (withdrawal.txnHash as string) || undefined;
          
          console.log(`NFT transfer initiated successfully: ${operation.withdrawalId}, state: ${withdrawalState}`);
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

    if (!nft.id || isNaN(parseInt(nft.id))) {
      return { valid: false, error: 'Invalid NFT token ID - must be numeric' };
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
export async function createNFTTransferService(serverSideContext?: { 
  accessToken?: string;
  cookies?: string;
  authenticatedUserId?: string;
}): Promise<NFTTransferService> {
  let accessToken: string;
  let authenticatedUserId: string;

  if (serverSideContext?.accessToken && serverSideContext?.authenticatedUserId) {
    // Use provided access token and user ID (for server-side calls)
    accessToken = serverSideContext.accessToken;
    authenticatedUserId = serverSideContext.authenticatedUserId;
  } else {
    // Get access token and user info from the API (for client-side calls)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add cookies if provided (for server-side calls with cookie context)
    if (serverSideContext?.cookies) {
      headers['Cookie'] = serverSideContext.cookies;
    }
    
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:4000';

    // Get access token
    const tokenResponse = await fetch(`${baseUrl}/api/access-token`, { headers });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token response error:', errorText);
      throw new Error(`Failed to get access token for NFT transfer: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.accessToken) {
      throw new Error('No access token available for NFT transfer');
    }
    accessToken = tokenData.accessToken;

    // Get authenticated user info
    const userResponse = await fetch(`${baseUrl}/api/auth/me`, { headers });
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info response error:', errorText);
      throw new Error(`Failed to get authenticated user info for NFT transfer: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    if (!userData.sub) {
      throw new Error('No authenticated user ID available for NFT transfer');
    }
    authenticatedUserId = userData.sub;
  }

  const context: TransferContext = {
    accessToken,
    graphqlEndpoint: 'https://staging.accounts.meetdapper.com/graphql',
    authenticatedUserId
  };

  console.log(`Creating NFT transfer service for user: ${authenticatedUserId}`);
  return new NFTTransferService(context);
}

/**
 * Convenience function to handle match finish and trigger transfers
 * IMPORTANT: This now only executes transfers FROM the authenticated user
 */
export async function handleMatchFinishTransfers(
  match: Match, 
  serverSideContext?: { accessToken?: string; cookies?: string; authenticatedUserId?: string }
): Promise<{
  success: boolean;
  operations: NFTTransferOperation[];
  error?: string;
}> {
  try {
    const transferService = await createNFTTransferService(serverSideContext);
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