// (C) 2012 Anton Zemlyanov
//
// This module "decompresses" several specific SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
// 
// "Compression" work here has nothing common with zlib or other compression lib
// it is a compact XML representation of bulk Betfair data.
// Example: 
// :20158165~Match Odds~O~ACTIVE~1164223800000~\Soccer\Scottish Soccer\Bells League Div 1\Fixtures 22 November \Partick v Clyde~
// /1/2695886/610072/10551708/10551709/20158165~0~1~GBR~1164192924479~3~1~8737.44~N~N:
//
// Exported properties:
//   decompressGetAllMarkets                     - decode getAllMarkets data
//   decompressGetCompleteMarketPricesCompressed - decompress getCompleteMarketPricesCompressed data
//   decompressGetMarketPricesCompressed         - decompress getMarketPricesCompressed data
//   decompressGetMarketTradedVolumeCompressed   - decompress getMarketTradedVolumeCompressed

exports.getMarketTradedVolumeCompressed = function(request) {
}

