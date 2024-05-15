import { type FC, useEffect } from 'react'
import { CensusAPI, Account, CspCensus, Election, PublishedCensus, VocdoniSDKClient, Vote, VoteAPI, getBytes, strip0x } from '@vocdoni/sdk'
import { vocdoniCryptoHelper } from '@smartapps-poll/web-common/dist/service/vocdoni/crypto'

const CryptoLoader: FC = () => {
  useEffect(() => {
    if ((window as any)._axiosAdapterHandler?.handle != null) {
      (window as any).axios27.defaults.adapter = (window as any)._axiosAdapterHandler?.handle
    }
    vocdoniCryptoHelper.AccountClass = Account
    vocdoniCryptoHelper.CspCensusClass = CspCensus
    vocdoniCryptoHelper.PublishedCensusClass = PublishedCensus
    vocdoniCryptoHelper.SDKClass = VocdoniSDKClient
    vocdoniCryptoHelper.VoteClass = Vote
    vocdoniCryptoHelper.getCensusSize = CensusAPI.size
    vocdoniCryptoHelper.strip0xFunc = strip0x
    vocdoniCryptoHelper.getBytesFunc = getBytes
    vocdoniCryptoHelper.voteInfoFunc = VoteAPI.info
    vocdoniCryptoHelper.createElectionFunc = Election.from
  }, [])
  return <></>
}

export default CryptoLoader
