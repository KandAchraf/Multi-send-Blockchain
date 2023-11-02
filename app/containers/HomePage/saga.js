/**
 * Send token to mulitple addresses
 */
import { fromJS } from 'immutable';
import Web3Utils from 'web3-utils';
import { call, put, select, takeLatest, take, all, fork, race} from 'redux-saga/effects';

import { loadNetworkPromise, finalizeWeb3InfoPromise } from './getWeb3Promise';
import getGasPricePromise from './getGasPricePromise';
import { 
  getDecimalsPromise,
  getBalancePromise,
  getEthBalancePromise,
  getAllowancePromise, 
  getCurrentFeePromise,
  getTokenSymbolPromise, 
  getArrayLimitPromise, 
  parseAddressesPromise 
} from './getTokenInfoPromise';
import { multiSendPromise, getTxStatus }  from './getTxSendPromise';

import {   
  LOAD_NETWORK,
  LOAD_GASPRICE,
  LOAD_TOKEN_INFO,
  LOAD_NETWORK_ERROR,
  LOAD_NETWORK_SUCCESS,
  LOAD_GASPRICE_SUCCESS,
  LOAD_TX_INFO,
  LOAD_TX_INFO_SUCCESS,
  LOAD_TX_INFO_ERROR,
  STOP_POLL_TX_STATUS
} from './constants';

import {  
  loadNetwork,
  networkLoaded,
  networkLoadingError,

  gasPriceLoaded,
  gasPriceLoadingError,
  loadGasPrice,

  loadTokenInfo,
  tokenInfoLoaded,
  tokenInfoLoadingError,

  loadTxInfo,
  txInfoLoaded,
  txInfoLoadingError,
  stopPollingTxStatus,
 } from './actions';


import {   
  makeSelectNetwork, 
  makeSelectTokenAddress,
  makeSelectTargetAddresses, 
  makeSelectGasPrice,
  makeSelectTokenInfo,
  makeSelectTxInfo,
} from './selectors';


/**
 *  This is the saga called when HomePage container mounted. 
 */
export function* loadNetworkSaga() {
  try {
    const web3Info = yield call(loadNetworkPromise);
    const finalWeb3Info = yield call(finalizeWeb3InfoPromise, web3Info);
    yield put(networkLoaded(finalWeb3Info));
    yield put(loadGasPrice()); 
    
    yield take([LOAD_GASPRICE_SUCCESS]);
    yield put(loadTokenInfo());
  } catch (err) {
    yield put(networkLoadingError(err));
  }
}

/**
 *  This is the saga called when HomePage asks selectable gas price. 
 */
export function* loadGasPriceInfoSaga() {
  try {
    console.log('Gas Saga_ start');
    const gasPrice = yield call(getGasPricePromise);   
    yield put(gasPriceLoaded(gasPrice));
  } catch (err) {
    yield put(gasPriceLoadingError(err));
  }
}
/**
 *  This is the saga called when HomePage asks selectable token Info. 
 */
export function* loadTokenInfoSaga() {
  try {
    
    console.log('LoadToken_start');
    //// tokenInfo structuring
    let tokenInfo = {
      tokenAddress: yield select(makeSelectTokenAddress()),
      proxyMultiSenderAddress: process.env.REACT_APP_PROXY_MULTISENDER || '0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f',
      decimals: 18, ///default for eth
      defAccTokenBalance: undefined,
      defAccEthBalance: undefined,
      allowance: undefined,
      currentFee: undefined,
      tokenSymbol: 'Eth',
      arrayLimit: undefined,
      
      jsonAddresses: yield select(makeSelectTargetAddresses()),
      addresses_to_send: [],
      dublicates: [],
      totalBalance: 0,
      invalid_addresses: [],
      balances_to_send: [],

      selectedGasPrice: (yield select(makeSelectGasPrice())).selectedGasPrice,
      standardGasPrice: undefined,
      totalNumberTx: undefined,
      totalCostInEth: undefined,
    }
    const currentfinalWeb3Info = yield select(makeSelectNetwork());
    // console.log('BEFORE', tokenInfo);
    let param = {
      web3Info: currentfinalWeb3Info,
      address: tokenInfo.tokenAddress,
      decimals: null, 
      proxyMultiSenderAddress: process.env.REACT_APP_PROXY_MULTISENDER || '0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f'     
    }
    ////Process the ERC20 token and ETH
    if(Web3Utils.isAddress(currentfinalWeb3Info.defaultAccount) && tokenInfo.tokenAddress !== "0x000000000000000000000000000000000000bEEF"){
      ////ERC20
      const tokenDecimals = yield call(getDecimalsPromise, param);  
      tokenInfo.decimals = tokenDecimals; 
      param.decimals = tokenDecimals;      
      const defAccTokenBalance = yield call(getBalancePromise, param);
      tokenInfo.defAccTokenBalance = defAccTokenBalance;
      const defAccEthBalance = yield call(getEthBalancePromise, param);
      tokenInfo.defAccEthBalance = defAccEthBalance;
      const allowance = yield call(getAllowancePromise, param);
      tokenInfo.allowance = allowance;
      const currentFee = yield call(getCurrentFeePromise, param);
      tokenInfo.currentFee = currentFee;
      const tokenSymbol = yield call(getTokenSymbolPromise, param);
      tokenInfo.tokenSymbol = tokenSymbol;
      const arrayLimit = yield call(getArrayLimitPromise, param);
      tokenInfo.arrayLimit = arrayLimit;
    } else { ///ETH
      tokenInfo.decimals = 18;
      const currentFee = yield call(getCurrentFeePromise, param);
      tokenInfo.currentFee = currentFee;
      const defAccEthBalance = yield call(getEthBalancePromise, param);
      tokenInfo.defAccEthBalance = defAccEthBalance;
      const arrayLimit = yield call(getArrayLimitPromise, param);
      tokenInfo.arrayLimit = arrayLimit;
    }    
      const finalTokenInfo = yield call(parseAddressesPromise, tokenInfo);
      yield put(tokenInfoLoaded(finalTokenInfo));
      console.log('Final Data',finalTokenInfo);
  } catch (err) {
    yield put(tokenInfoLoadingError(err));
  }
}

/**
 *  This is the saga called when HomePage execute tx send. 
 *  Must call this after success of tokenInfo saga from UI.
 */
export function* loadTxInfoSaga() {
  try {
    console.log('Tx Send Saga_ start');
    const param = {
      tokenInfo: yield select(makeSelectTokenInfo()),
      web3Info: yield select(makeSelectNetwork()),  
    }
    const finalTxInfo = yield call(multiSendPromise, param);   
    yield put(txInfoLoaded(fromJS(finalTxInfo)));
  } catch (err) {
    yield put(txInfoLoadingError(err));
  }
}
/*****   Polling Tx status *********/
// Utility function for delay effects
function delay(millisec) {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve(true), millisec);
  });
  return promise;
}

// Fetch data every X seconds
function* pollData() {
  try {
    console.log('after_delay_pollData_run');
    const param = {
      txInfo: yield select(makeSelectTxInfo()),
      web3Info: yield select(makeSelectNetwork()),  
    }
    const updated_txInfo = yield call (getTxStatus, param);
    console.log('saga_poll', updated_txInfo);

    yield put(txInfoLoaded(updated_txInfo));    

  } catch (error) {
    console.log('pollData Error');
    yield put(txInfoLoadingError(error));   
  }
}

// Start Polling when first call to check tx status
function* watchPollData() {
  yield call(delay, 6000);
  const updated_txInfo = yield select(makeSelectTxInfo());  
  if(updated_txInfo.get('status') === 'pending'){
    console.log('update'); 
    yield call(pollData);  
  }
}
///////////////////////////////////////
/**
 * Root saga manages watcher lifecycle
 */
export default function* githubData() {
  yield takeLatest(LOAD_NETWORK, loadNetworkSaga);
  yield takeLatest(LOAD_GASPRICE, loadGasPriceInfoSaga);
  yield takeLatest(LOAD_TOKEN_INFO, loadTokenInfoSaga);

  yield takeLatest(LOAD_TX_INFO, loadTxInfoSaga);
  yield takeLatest(LOAD_TX_INFO_SUCCESS, watchPollData);
}
