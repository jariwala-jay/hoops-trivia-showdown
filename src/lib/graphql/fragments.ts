import { gql } from "@apollo/client";

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