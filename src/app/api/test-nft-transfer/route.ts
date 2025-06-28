import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get access token
    const tokenResponse = await fetch(`${process.env.AUTH0_BASE_URL || 'http://localhost:4000'}/api/access-token`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    console.log('Testing NFT withdrawal with hardcoded data...');

    // Test data - using your actual Flow address as source since you own the NFT
    const testData = {
      tokenID: "11020763", // Use the actual token ID from your NFT
      toAddress: "0x3a27d8c25ace41aa", // Your Flow address
      fromAddress: "0x3963db70043b3c5b", // Mock from address (would be the other player's)
      dappID: "ad3260ba-a87c-4359-a8b0-def2cc36310b", // NBA Top Shot dapp ID
      contract: "A.877931736ee77cff.TopShot" // NBA Top Shot contract
    };

    console.log('Test withdrawal data:', testData);

    // Make the withdrawal API call
    const withdrawalApiResponse = await fetch('https://staging.accounts.meetdapper.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': tokenData.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation WithdrawNFT($input: WithdrawNFTInput!) {
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
        }`,
        variables: {
          input: {
            tokenID: testData.tokenID,
            destinationAddress: testData.toAddress,
            dappID: testData.dappID,
            contractQualifiedName: testData.contract,
          }
        }
      })
    });

    if (!withdrawalApiResponse.ok) {
      const errorText = await withdrawalApiResponse.text();
      console.error('Withdrawal API request failed:', withdrawalApiResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Withdrawal API request failed',
        status: withdrawalApiResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const withdrawalData = await withdrawalApiResponse.json();
    console.log('Withdrawal API response:', JSON.stringify(withdrawalData, null, 2));

    if (withdrawalData.errors) {
      console.error('Withdrawal GraphQL errors:', withdrawalData.errors);
      return NextResponse.json({ 
        error: 'Withdrawal GraphQL errors',
        details: withdrawalData.errors 
      }, { status: 500 });
    }

    const withdrawalResult = withdrawalData.data?.withdrawNFT;
    
    if (!withdrawalResult) {
      return NextResponse.json({ 
        error: 'No withdrawal response received',
        response: withdrawalData
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      withdrawalResponse: withdrawalResult,
      withdrawal: withdrawalResult.withdrawal,
      testData: testData,
      message: 'NFT withdrawal test completed',
      state: withdrawalResult.withdrawal?.state
    });

  } catch (error) {
    console.error('Error testing NFT withdrawal:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a new endpoint to check withdrawal status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('id');
    
    // if (!withdrawalId) {
    //   return NextResponse.json({ error: 'Withdrawal ID required' }, { status: 400 });
    // }

    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get access token
    const tokenResponse = await fetch(`${process.env.AUTH0_BASE_URL || 'http://localhost:4000'}/api/access-token`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Query withdrawal status
    const statusResponse = await fetch('https://staging.accounts.meetdapper.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': tokenData.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query GetNFTWithdrawal($id: ID!) {
          getNFTWithdrawal(id: $id) {
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
        }`,
        variables: {
          id: withdrawalId
        }
      })
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      return NextResponse.json({ 
        error: 'Failed to query withdrawal status',
        details: errorText
      }, { status: 500 });
    }

    const statusData = await statusResponse.json();
    console.log('Withdrawal status response:', JSON.stringify(statusData, null, 2));

    return NextResponse.json({
      success: true,
      withdrawal: statusData.data?.getNFTWithdrawal,
      message: 'Withdrawal status retrieved'
    });

  } catch (error) {
    console.error('Error checking withdrawal status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add endpoint to check what NFTs the user actually owns
export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get access token
    const tokenResponse = await fetch(`${process.env.AUTH0_BASE_URL || 'http://localhost:4000'}/api/access-token`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Query user's NFTs
    const tokensResponse = await fetch('https://staging.accounts.meetdapper.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': tokenData.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query GetTokens {
          getTokens {
            totalCount
            tokens {
              id
              title
              imageURL
              description
              serialNumber
              acquiredAt
              isWithdrawInProgress
              favorite
              contract
              dapp {
                id
                name
                tokenFallbackImageURL
                tokenFallbackImageDarkURL
                nftCanBeUsedAsAvatar
              }
              tokenContractData {
                contract
                storageInitializationCadence
                checkInitializationCadence
              }
            }
          }
        }`
      })
    });

    if (!tokensResponse.ok) {
      const errorText = await tokensResponse.text();
      return NextResponse.json({ 
        error: 'Failed to query user tokens',
        details: errorText
      }, { status: 500 });
    }

    const tokensData = await tokensResponse.json();
    console.log('User tokens response:', JSON.stringify(tokensData, null, 2));

    return NextResponse.json({
      success: true,
      tokens: tokensData.data?.getTokens?.tokens || [],
      message: 'User tokens retrieved'
    });

  } catch (error) {
    console.error('Error checking user tokens:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 