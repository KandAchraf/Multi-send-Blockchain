import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';

import { 
  loadNetwork,
  updateSelectedGasPrice, 
  loadGasPrice,
  changeTokenInfo,
  loadTokenInfo,
  loadTargetAddresses,
  loadTxInfo,
} from './actions';
import { 
  makeSelectNetwork,
  makeSelectNetworkLoading,
  makeSelectLoadingNetworkError,

  makeSelectGasPrice,
  makeSelectGasPriceLoading,
  makeSelectLoadingGasPriceError,

  makeSelectTokenInfoLoading,
  makeSelectLoadingTokenInfoError,
  makeSelectTokenInfo,

  makeSelectTxInfoLoading,
  makeSelectLoadingTxInfoError,
  makeSelectTxInfo,

} from './selectors';
import reducer from './reducer';
import saga from './saga';
import HomePage from './HomePage';
 
const mapDispatchToProps = (dispatch) => ({
  onNetworkLoad: (evt) => {
    if (evt !== undefined && evt.preventDefault) evt.preventDefault();
    dispatch(loadNetwork());
  },
  onLoadGasPrice: (evt) => {
    if (evt !== undefined && evt.preventDefault) evt.preventDefault();
    dispatch(loadGasPrice());
  },
  onLoadTokenInfo: (evt) => {
    if (evt !== undefined && evt.preventDefault) evt.preventDefault();
    dispatch(loadTokenInfo());
  },
  onLoadTxInfo: (evt) => {
    if (evt !== undefined && evt.preventDefault) evt.preventDefault();
    dispatch(loadTxInfo());
  },
  onUpdateSelectedGasPrice: (evt) => dispatch(updateSelectedGasPrice(evt)),
  onUpdateSelectTokenAddress: (evt) => dispatch(changeTokenInfo(evt)),
  onLoadTargetAddresses: (evt) => dispatch(loadTargetAddresses(evt)),
});

const mapStateToProps = createStructuredSelector({
  web3Info: makeSelectNetwork(),
  web3InfoLoading: makeSelectNetworkLoading(),
  web3InfoLoadingError: makeSelectLoadingNetworkError(),
  
  gasPriceInfo: makeSelectGasPrice(),
  gasPriceInfoLoading: makeSelectGasPriceLoading(),
  gasPriceInfoLoadingError: makeSelectLoadingGasPriceError(),
  
  tokenInfoLoading: makeSelectTokenInfoLoading(),
  tokenInfoLoadingError: makeSelectLoadingTokenInfoError(),
  tokenInfo: makeSelectTokenInfo(),

  txInfoLoading: makeSelectTxInfoLoading(),
  txInfoLoadingError: makeSelectLoadingTxInfoError(),
  txInfo: makeSelectTxInfo(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'home', reducer });
const withSaga = injectSaga({ key: 'home', saga });

export default compose(withReducer, withSaga, withConnect)(HomePage);
export { mapDispatchToProps };
