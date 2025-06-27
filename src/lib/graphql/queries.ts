import { gql } from '@apollo/client';

// Token info fragment - core data structure for Dapper tokens/NFTs
export const TOKEN_INFO_FRAGMENT = gql`
  fragment TokenInfo on Token {
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
`;

// Token withdrawal progress fragment
export const TOKEN_WITHDRAW_PROGRESS_FRAGMENT = gql`
  fragment TokenWithdrawProgress on Token {
    id
    isWithdrawInProgress
  }
`;

// Main query to get user's tokens/NFTs from Dapper
export const GET_TOKENS = gql`
  query GetTokens($input: GetTokensInput!) {
    getTokens(input: $input) {
      tokens {
        ...TokenInfo
      }
      totalCount
    }
  }
  ${TOKEN_INFO_FRAGMENT}
`;

// Get single token details
export const GET_TOKEN = gql`
  query GetToken($input: GetTokenInput!) {
    getToken(input: $input) {
      token {
        ...TokenInfo
      }
    }
  }
  ${TOKEN_INFO_FRAGMENT}
`;

// Get user account info
export const GET_ACCOUNT = gql`
  query GetAccount {
    getAccount {
      id
      username
      avatarID
      avatarURL
    }
  }
`;

// Get user's Flow account information
export const GET_MY_FLOW_ACCOUNT = gql`
  query GetMyFlowAccount {
    getMyFlowAccount
  }
`;

// Get public Flow account by address
export const GET_FLOW_ACCOUNT = gql`
  query GetFlowAccount($address: String!) {
    getFlowAccount(address: $address)
  }
`;

// Withdraw NFT Mutation - use correct field names
export const WITHDRAW_NFT_MUTATION = gql`
  mutation WithdrawNft($input: WithdrawNFTInput!) {
    withdrawNFT(input: $input) {
      id
      withdrawal {
        id
        tokenID
        dappID
        contractQualifiedName
        destinationAddress
        state
        createdAt
        completedAt
        transactionHash
      }
    }
  }
`;

// Alternative mutation without input wrapper (in case the schema is different)
export const WITHDRAW_NFT_MUTATION_ALT = gql`
  mutation WithdrawNftAlt(
    $dappID: String!
    $destinationAddress: String!
    $tokenID: Int!
    $contractQualifiedName: String
  ) {
    withdrawNFT(
      dappID: $dappID
      destinationAddress: $destinationAddress
      tokenID: $tokenID
      contractQualifiedName: $contractQualifiedName
    ) {
      id
      withdrawal {
        id
        tokenID
        dappID
        contractQualifiedName
        destinationAddress
        state
        createdAt
        completedAt
        transactionHash
      }
    }
  }
`;

// Get public tokens (for testing without auth)
export const GET_PUBLIC_TOKENS = gql`
  query GetTokensPublic($input: GetTokensPublicInput!) {
    getTokensPublic(input: $input) {
      tokens {
        ...TokenInfo
      }
      totalCount
    }
  }
  ${TOKEN_INFO_FRAGMENT}
`; 