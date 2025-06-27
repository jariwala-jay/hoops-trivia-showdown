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